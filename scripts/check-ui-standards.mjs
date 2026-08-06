import { parse as parseSfc } from '@vue/compiler-sfc';
import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import vueParser from 'vue-eslint-parser';

const TEMPLATE_RULES = new Set(['button-type', 'button-name', 'no-interactive-generic-element']);
const SCRIPT_RULES = new Set(['no-english-accessible-default']);
const STYLE_RULES = new Set([
  'no-outline-suppression',
  'no-raw-color',
  'undocumented-global-style',
  'global-selector-leakage',
]);
const E2E_RULES = new Set(['no-private-vue-runtime', 'no-arbitrary-sleep', 'no-disabled-required-test']);
const KNOWN_RULES = new Set([...TEMPLATE_RULES, ...SCRIPT_RULES, ...STYLE_RULES, ...E2E_RULES]);
const USER_FACING_PROP = /^(?:ariaLabel|bottomLabel|description|hint|label|message|name|text|title|topLabel)$/i;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

async function listVueFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listVueFiles(filename)));
    else if (entry.isFile() && filename.endsWith('.vue')) files.push(filename);
  }
  return files;
}

function addViolation(violations, file, line, rule, message) {
  violations.push({ file, line: Math.max(1, Number(line) || 1), rule, message });
}

function propertyName(property) {
  if (!property || property.type !== 'Property' || property.computed) return null;
  if (property.key.type === 'Identifier') return property.key.name;
  if (property.key.type === 'Literal' && typeof property.key.value === 'string') return property.key.value;
  return null;
}

function memberPropertyName(member) {
  if (!member || member.type !== 'MemberExpression') return null;
  if (!member.computed && member.property.type === 'Identifier') return member.property.name;
  if (member.computed && member.property.type === 'Literal' && typeof member.property.value === 'string') {
    return member.property.value;
  }
  return null;
}

function memberRootName(member) {
  let current = member;
  while (current?.type === 'MemberExpression' || current?.type === 'ChainExpression') {
    current = current.type === 'ChainExpression' ? current.expression : current.object;
  }
  return current?.type === 'Identifier' ? current.name : null;
}

function walkEstree(node, visitor, seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (typeof node.type === 'string') visitor(node);
  for (const [key, value] of Object.entries(node)) {
    if (['comments', 'loc', 'parent', 'range', 'templateBody', 'tokens'].includes(key)) continue;
    if (Array.isArray(value)) {
      for (const child of value) walkEstree(child, visitor, seen);
    } else {
      walkEstree(value, visitor, seen);
    }
  }
}

function walkTemplate(node, visitor) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VElement') visitor(node);
  for (const child of node.children ?? []) walkTemplate(child, visitor);
}

function directiveName(attribute) {
  return attribute.directive ? attribute.key.name?.name : null;
}

function directiveArgument(attribute) {
  const argument = attribute.directive ? attribute.key.argument : null;
  if (!argument) return null;
  if (argument.type === 'VIdentifier') return argument.name;
  if (argument.type === 'VExpressionContainer' && argument.expression?.type === 'Literal') {
    return String(argument.expression.value);
  }
  return null;
}

function attributeName(attribute) {
  if (!attribute.directive) return attribute.key.name;
  if (directiveName(attribute) === 'bind') return directiveArgument(attribute);
  return null;
}

function hasAttribute(element, names) {
  const expected = new Set(names);
  return element.startTag.attributes.some((attribute) => expected.has(attributeName(attribute)));
}

function staticAttributeValue(element, name) {
  const attribute = element.startTag.attributes.find((candidate) => attributeName(candidate) === name);
  if (!attribute?.value) return null;
  if (!attribute.directive) return attribute.value.value;
  const expression = attribute.value.expression;
  if (expression?.type === 'Literal') return expression.value;
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis[0]?.value?.cooked ?? '';
  }
  return null;
}

function hasEventDirective(element, eventNames) {
  const expected = new Set(eventNames);
  return element.startTag.attributes.some(
    (attribute) => directiveName(attribute) === 'on' && expected.has(directiveArgument(attribute)),
  );
}

function isAriaHidden(element) {
  return String(staticAttributeValue(element, 'aria-hidden')).toLowerCase() === 'true';
}

function hasNonEmptyAttribute(element, names) {
  for (const name of names) {
    const attribute = element.startTag.attributes.find((candidate) => attributeName(candidate) === name);
    if (!attribute) continue;
    if (attribute.directive) return true;
    if (attribute.value?.value?.trim()) return true;
  }
  return false;
}

function hasAccessibleContent(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'VText') return Boolean(node.value.trim());
  if (node.type === 'VExpressionContainer') return Boolean(node.expression);
  if (node.type !== 'VElement' || isAriaHidden(node)) return false;
  if (node.name === 'slot') return true;
  if (node.name === 'img' && hasNonEmptyAttribute(node, ['alt'])) return true;
  if (hasNonEmptyAttribute(node, ['aria-label', 'aria-labelledby'])) return true;
  return node.children.some(hasAccessibleContent);
}

function scanTemplate(file, templateBody, activeRules, violations) {
  if (!templateBody) {
    addViolation(violations, file, 1, 'vue-parse-error', 'Vue template AST is unavailable.');
    return;
  }

  walkTemplate(templateBody, (element) => {
    if (element.name === 'button') {
      if (activeRules.has('button-type') && !hasAttribute(element, ['type'])) {
        addViolation(violations, file, element.loc.start.line, 'button-type', 'Button is missing an explicit type.');
      }
      if (
        activeRules.has('button-name') &&
        !hasNonEmptyAttribute(element, ['aria-label', 'aria-labelledby', 'title']) &&
        !element.children.some(hasAccessibleContent)
      ) {
        addViolation(
          violations,
          file,
          element.loc.start.line,
          'button-name',
          'Icon-only button is missing an accessible name.',
        );
      }
    }

    if (
      activeRules.has('no-interactive-generic-element') &&
      ['div', 'span'].includes(element.name) &&
      (hasEventDirective(element, ['click', 'keydown', 'keypress', 'keyup']) ||
        String(staticAttributeValue(element, 'role')).toLowerCase() === 'button')
    ) {
      addViolation(
        violations,
        file,
        element.loc.start.line,
        'no-interactive-generic-element',
        'Use a native button instead of a generic interactive element.',
      );
    }
  });
}

function literalString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? '';
  }
  if (node.type === 'ArrowFunctionExpression') return literalString(node.body);
  if (node.type === 'FunctionExpression' && node.body?.type === 'BlockStatement') {
    const returned = node.body.body.find((statement) => statement.type === 'ReturnStatement');
    return literalString(returned?.argument);
  }
  return null;
}

function scanScriptDefaults(file, ast, activeRules, violations) {
  if (!activeRules.has('no-english-accessible-default')) return;
  walkEstree(ast, (node) => {
    if (node.type !== 'Property' || propertyName(node) !== 'default') return;
    const propProperty = node.parent?.parent;
    const propName = propertyName(propProperty);
    if (!propName || !USER_FACING_PROP.test(propName)) return;
    const value = literalString(node.value);
    if (!value?.trim() || !/[A-Za-z]/.test(value)) return;
    addViolation(
      violations,
      file,
      node.loc.start.line,
      'no-english-accessible-default',
      `User-facing ${propName} defaults must be localized at the consumer boundary.`,
    );
  });
}

function styleLine(style, relativeLine = 1) {
  return style.loc.start.line + Math.max(0, relativeLine - 1);
}

function declarationHasRawColor(value) {
  let found = false;
  const visit = (nodes, insideTokenFallback = false) => {
    for (const node of nodes ?? []) {
      if (found) return;
      const isVar = node.type === 'function' && node.value.toLowerCase() === 'var';
      const withinVar = insideTokenFallback || isVar;
      if (!withinVar && node.type === 'word' && /^#[0-9a-f]{3,8}$/i.test(node.value)) {
        found = true;
        return;
      }
      if (!withinVar && node.type === 'function' && /^(?:rgb|hsl)a?$/i.test(node.value)) {
        found = true;
        return;
      }
      if (node.nodes) visit(node.nodes, withinVar);
    }
  };
  visit(valueParser(value).nodes);
  return found;
}

function selectorContainsNamespace(selector, namespace) {
  const namespaceAst = selectorParser().astSync(namespace);
  const target = namespaceAst.nodes[0]?.nodes.find((node) => !['comment', 'combinator'].includes(node.type));
  if (!target) throw new Error(`Invalid global style namespace: ${namespace}`);
  let found = false;
  selector.walk((node) => {
    if (node.type !== target.type) return;
    if (node.type === 'class') {
      if (
        node.value === target.value ||
        node.value.startsWith(`${target.value}--`) ||
        node.value.startsWith(`${target.value}__`)
      ) {
        found = true;
      }
      return;
    }
    if (node.toString() === target.toString()) found = true;
  });
  return found;
}

function insideKeyframes(rule) {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return true;
    parent = parent.parent;
  }
  return false;
}

function scanStyle(file, style, activeRules, namespace, violations) {
  let root;
  try {
    root = postcss.parse(style.content, { from: file });
  } catch (error) {
    addViolation(
      violations,
      file,
      styleLine(style, error.line),
      'style-parse-error',
      `Unable to parse style block: ${error.reason ?? error.message}`,
    );
    return;
  }

  if (activeRules.has('no-outline-suppression')) {
    root.walkDecls(/^outline$/i, (declaration) => {
      if (!/^(?:none|0(?:\b|$))/i.test(declaration.value.trim())) return;
      addViolation(
        violations,
        file,
        styleLine(style, declaration.source.start.line),
        'no-outline-suppression',
        'Do not suppress focus outlines; provide a tested visible focus indicator.',
      );
    });
  }

  if (activeRules.has('no-raw-color')) {
    root.walkDecls((declaration) => {
      if (!declarationHasRawColor(declaration.value)) return;
      addViolation(
        violations,
        file,
        styleLine(style, declaration.source.start.line),
        'no-raw-color',
        'Use a declared design token instead of a hard-coded color.',
      );
    });
  }

  if (style.scoped || style.module) return;
  if (!namespace) {
    if (activeRules.has('undocumented-global-style')) {
      addViolation(
        violations,
        file,
        style.loc.start.line,
        'undocumented-global-style',
        'Unscoped styles require a documented component namespace.',
      );
    }
    return;
  }
  if (!activeRules.has('global-selector-leakage')) return;

  root.walkRules((rule) => {
    if (insideKeyframes(rule)) return;
    try {
      selectorParser((selectors) => {
        selectors.each((selector) => {
          if (selectorContainsNamespace(selector, namespace)) return;
          addViolation(
            violations,
            file,
            styleLine(style, rule.source.start.line),
            'global-selector-leakage',
            `Global selector must be namespaced under ${namespace}.`,
          );
        });
      }).processSync(rule.selector);
    } catch (error) {
      addViolation(
        violations,
        file,
        styleLine(style, rule.source.start.line),
        'style-selector-parse-error',
        `Unable to parse selector: ${error.message}`,
      );
    }
  });
}

function scanVue(file, text, activeRules, namespace, violations) {
  const sfc = parseSfc(text, { filename: file });
  for (const error of sfc.errors) {
    addViolation(
      violations,
      file,
      error.loc?.start?.line ?? error.line ?? 1,
      'vue-parse-error',
      error.message ?? String(error),
    );
  }

  let parsed;
  try {
    parsed = vueParser.parseForESLint(text, {
      ecmaVersion: 'latest',
      filePath: file,
      sourceType: 'module',
    });
  } catch (error) {
    addViolation(violations, file, error.lineNumber ?? 1, 'vue-parse-error', error.message);
    return;
  }

  if ([...activeRules].some((rule) => TEMPLATE_RULES.has(rule))) {
    scanTemplate(file, parsed.ast.templateBody, activeRules, violations);
  }
  if ([...activeRules].some((rule) => SCRIPT_RULES.has(rule))) {
    scanScriptDefaults(file, parsed.ast, activeRules, violations);
  }
  if ([...activeRules].some((rule) => STYLE_RULES.has(rule))) {
    for (const style of sfc.descriptor.styles) scanStyle(file, style, activeRules, namespace, violations);
  }
}

function scanE2e(file, text, activeRules, violations) {
  let ast;
  try {
    ast = vueParser.parseForESLint(text, {
      ecmaVersion: 'latest',
      filePath: file,
      sourceType: 'module',
    }).ast;
  } catch (error) {
    addViolation(violations, file, error.lineNumber ?? 1, 'javascript-parse-error', error.message);
    return;
  }

  walkEstree(ast, (node) => {
    if (node.type === 'MemberExpression' && activeRules.has('no-private-vue-runtime')) {
      const property = memberPropertyName(node);
      const isPrivateVue = ['__vue_app__', '__vueParentComponent'].includes(property);
      const isPrivatePinia = property === '_s' && memberPropertyName(node.object) === '$pinia';
      if (isPrivateVue || isPrivatePinia) {
        addViolation(
          violations,
          file,
          node.loc.start.line,
          'no-private-vue-runtime',
          'E2E must use public UI behavior or an explicit test adapter.',
        );
      }
    }

    if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return;
    const method = memberPropertyName(node.callee);
    if (activeRules.has('no-arbitrary-sleep') && method === 'waitForTimeout') {
      addViolation(
        violations,
        file,
        node.loc.start.line,
        'no-arbitrary-sleep',
        'Wait for an observable state instead of sleeping for a fixed duration.',
      );
    }
    if (
      activeRules.has('no-disabled-required-test') &&
      ['fixme', 'only', 'skip'].includes(method) &&
      ['describe', 'test'].includes(memberRootName(node.callee))
    ) {
      addViolation(
        violations,
        file,
        node.loc.start.line,
        'no-disabled-required-test',
        'Required tests must not be skipped or focused.',
      );
    }
  });
}

function validateAllowlist(entries) {
  const errors = [];
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set();
  for (const [index, entry] of entries.entries()) {
    for (const field of ['file', 'line', 'rule', 'reason', 'owner', 'expires']) {
      if (entry[field] === undefined || entry[field] === '') {
        addViolation(errors, 'config/ui-standards-allowlist.json', index + 1, 'invalid-allowlist', `Missing ${field}.`);
      }
    }
    if (!Number.isInteger(entry.line) || entry.line < 1 || /[*?[\]{}]/.test(entry.file ?? '')) {
      addViolation(
        errors,
        'config/ui-standards-allowlist.json',
        index + 1,
        'invalid-allowlist',
        'Waivers require one literal file and positive integer line.',
      );
    }
    if (entry.expires && !/^\d{4}-\d{2}-\d{2}$/.test(entry.expires)) {
      addViolation(errors, entry.file, entry.line, 'invalid-allowlist', 'Waiver expiry must use YYYY-MM-DD.');
    } else if (entry.expires && entry.expires < today) {
      addViolation(errors, entry.file, entry.line, 'expired-allowlist', `Waiver expired on ${entry.expires}.`);
    }
    const key = `${entry.file}:${entry.line}:${entry.rule}`;
    if (seen.has(key)) {
      addViolation(errors, entry.file, entry.line, 'invalid-allowlist', 'Duplicate waiver entry.');
    }
    seen.add(key);
  }
  return errors;
}

async function resolveRuleScopes(root, config, violations) {
  const groups = new Map();
  for (const [groupName, group] of Object.entries(config.fileGroups ?? {})) {
    const files = new Set(group.files ?? []);
    for (const directory of group.directories ?? []) {
      try {
        for (const absolute of await listVueFiles(path.join(root, directory))) {
          files.add(toPosix(path.relative(root, absolute)));
        }
      } catch (error) {
        addViolation(
          violations,
          'config/ui-standards.json',
          1,
          'invalid-rule-scope',
          `Cannot read ${groupName} directory ${directory}: ${error.message}`,
        );
      }
    }
    groups.set(groupName, files);
  }

  const filesToRules = new Map();
  for (const [rule, groupNames] of Object.entries(config.ruleScopes ?? {})) {
    if (!KNOWN_RULES.has(rule)) {
      addViolation(
        violations,
        'config/ui-standards.json',
        1,
        'invalid-rule-scope',
        `Unknown UI standards rule: ${rule}.`,
      );
      continue;
    }
    for (const groupName of groupNames) {
      const files = groups.get(groupName);
      if (!files) {
        addViolation(
          violations,
          'config/ui-standards.json',
          1,
          'invalid-rule-scope',
          `Rule ${rule} references missing file group ${groupName}.`,
        );
        continue;
      }
      for (const file of files) {
        if (!filesToRules.has(file)) filesToRules.set(file, new Set());
        filesToRules.get(file).add(rule);
      }
    }
  }
  return filesToRules;
}

function uniqueViolations(violations) {
  const seen = new Set();
  return violations.filter((violation) => {
    const key = `${violation.file}:${violation.line}:${violation.rule}:${violation.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scanUiStandards({ root = process.cwd(), config: suppliedConfig } = {}) {
  const resolvedRoot = await realpath(root);
  const config =
    suppliedConfig ?? JSON.parse(await readFile(path.join(resolvedRoot, 'config/ui-standards.json'), 'utf8'));
  const allowlist = config.allowlistFile
    ? (JSON.parse(await readFile(path.join(resolvedRoot, config.allowlistFile), 'utf8')).entries ?? [])
    : [];
  const violations = validateAllowlist(allowlist);
  const filesToRules = await resolveRuleScopes(resolvedRoot, config, violations);

  for (const [file, activeRules] of [...filesToRules.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    let text;
    try {
      text = await readFile(path.join(resolvedRoot, file), 'utf8');
    } catch (error) {
      addViolation(violations, file, 1, 'invalid-rule-scope', `Cannot read scoped file: ${error.message}`);
      continue;
    }
    if (file.endsWith('.vue')) {
      scanVue(file, text, activeRules, config.globalStyleNamespaces?.[file], violations);
    } else {
      scanE2e(file, text, activeRules, violations);
    }
  }

  const discovered = uniqueViolations(violations);
  const discoveredKeys = new Set(discovered.map(({ file, line, rule }) => `${file}:${line}:${rule}`));
  for (const [index, entry] of allowlist.entries()) {
    const key = `${entry.file}:${entry.line}:${entry.rule}`;
    if (!discoveredKeys.has(key)) {
      addViolation(
        discovered,
        'config/ui-standards-allowlist.json',
        index + 1,
        'stale-allowlist',
        `Waiver no longer matches ${key}. Remove or update it.`,
      );
    }
  }

  const active = discovered.filter(
    (violation) =>
      !allowlist.some(
        (entry) => entry.file === violation.file && entry.line === violation.line && entry.rule === violation.rule,
      ),
  );
  return uniqueViolations(active).sort(
    (left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line || left.rule.localeCompare(right.rule),
  );
}

async function main() {
  const violations = await scanUiStandards();
  console.log(JSON.stringify({ ok: violations.length === 0, violations }, null, 2));
  if (violations.length > 0) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === fileURLToPath(import.meta.url)) await main();
