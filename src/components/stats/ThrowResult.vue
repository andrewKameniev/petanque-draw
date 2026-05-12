<script>
import StatCheckbox from "@/components/stats/StatCheckbox.vue";
import {throwDistances} from "@/helpers-stat";

const clickOutsideDirective = {
    beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
            if (!(el === event.target || el.contains(event.target))) {
                binding.value(event);
            }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
    },
};
export default {
    name: "ThrowResult",
    components: {StatCheckbox},
    props: ['info', 'iterator', 'system'],
    data() {
        return {
            isMenuVisible: false,
            longPressTimer: null,
            isLongPress: false,
            selectOpen: false,
            frenchSystem: ['H', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'I']
        };
    },
    directives: {
        clickOutside: clickOutsideDirective,
    },
    computed: {
        getThrowDistances() {
            return throwDistances
        }
    },
    methods: {
        showMenu() {
            if (!this.selectOpen) {
                this.isMenuVisible = true;
            }
        },
        hideMenu() {
            this.isMenuVisible = false;
        },
        handleMouseDown() {
            this.isLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.showMenu();
            }, 500);
        },
        handleMouseUp() {
            clearTimeout(this.longPressTimer);
        },
        handleTouchStart() {
            this.isLongPress = false;
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.showMenu();
            }, 500);
        },
        handleTouchEnd() {
            clearTimeout(this.longPressTimer);
        },
        handleElementClick(event) {
            if (this.isLongPress) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        removeThrow() {
            this.$emit('remove');
            this.hideMenu();
        },
        superThrow(result) {
            this.$emit('super', !result);
            this.hideMenu();
        },
        onClickOutside () {
            this.hideMenu()
        },
        getFrenchLabel(value) {
            if (value === 'H') {
                return '+'
            } else if (value === 'I') {
                return '-'
            } else {
                return value
            }
        }
    },
}
</script>

<template>
    <div @mousedown.stop="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseUp"
         @touchstart.stop="handleTouchStart" @touchend.stop="handleTouchEnd" @touchcancel="handleTouchEnd"
         class="longpress-area" v-click-outside="onClickOutside">
        <div class="is-flex is-align-items-center" style="gap: 5px" v-if="info.isMade">
            <span class="is-size-3" :class="{'has-text-success': info.success, 'has-text-danger': !info.success}" v-if="info.x2">!</span>
            <div class="checkbox-wrapper-10">
                <input class="tgl tgl-flip" :id="iterator" type="checkbox" :checked="info.type === 'p'"
                       @change="$emit('updatetype', $event.target.checked ? 'p' : 't')"
                       @click="handleElementClick"/>
                <label class="tgl-btn" data-tg-off="Tir" data-tg-on="Point" :for="iterator"></label>
            </div>
            <StatCheckbox v-if="system === 'simple'" :checked-value="info.success" @changeval="$emit('updateresult', $event)" @click="handleElementClick"/>
            <div v-else class="control">
                <div class="select">
                    <select :name="'throwResult' + iterator" :id="'throwResult' + iterator" :value="info.french"
                            @focus="selectOpen = true" @blur="selectOpen = false" @change="$emit('updateresultfrench', $event.target.value)">
                        <option v-for="value in frenchSystem" :value="value" :key="value">{{ getFrenchLabel(value) }}</option>
                    </select>
                </div>
            </div>
        </div>
        <div v-else class="gost-throw" @click="$emit('add')"></div>
        <div v-if="isMenuVisible" class="custom-menu">
            <ul>
                <li v-if="system === 'simple'" @click="superThrow(info.x2)">{{ info.x2 ? 'remove x2' : 'x2 result' }}</li>
                <li @click="removeThrow()">Remove throw</li>
                <li class="is-flex is-align-items-center" style="gap: 5px">
                    <span class="select">
                        <select :name="'throwResultDistances' + iterator" :id="'throwResultDistances' + iterator" :value="info.distance"
                                @focus="selectOpen = true" @blur="selectOpen = false" @change="$emit('updatedistance', $event.target.value)">
                            <option v-for="value in getThrowDistances" :value="value" :key="value">~{{value}}m</option>
                        </select>
                    </span>
                    m
                </li>
            </ul>
        </div>
    </div>

</template>

<style scoped>
.gost-throw {
    width: 79px;
    height: 32px;
    border: solid 1px var(--color-border-medium);
    border-radius: 7px;
    cursor: pointer;
}

.longpress-area {
    width: 100%;
    position: relative;
    user-select: none;
}

.custom-menu {
    position: absolute;
    right: 0;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-medium);
    box-shadow: 0 4px 6px var(--color-card-shadow);
    z-index: 1000;
    width: 150px;
    border-radius: 6px;
}

.custom-menu ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.custom-menu li {
    padding: 8px 16px;
    cursor: pointer;
    color: var(--color-text);
}

.custom-menu li:hover {
    background-color: var(--color-surface-hover);
}

.checkbox-wrapper-10 .tgl {
    display: none;
}
.checkbox-wrapper-10 .tgl,
.checkbox-wrapper-10 .tgl:after,
.checkbox-wrapper-10 .tgl:before,
.checkbox-wrapper-10 .tgl *,
.checkbox-wrapper-10 .tgl *:after,
.checkbox-wrapper-10 .tgl *:before,
.checkbox-wrapper-10 .tgl + .tgl-btn {
    box-sizing: border-box;
}
.checkbox-wrapper-10 .tgl::selection,
.checkbox-wrapper-10 .tgl *::selection,
.checkbox-wrapper-10 .tgl + .tgl-btn::selection {
    background: none;
}
.checkbox-wrapper-10 .tgl + .tgl-btn {
    outline: 0;
    display: block;
    font-size: 0.8em;
    width: 32px;
    height: 32px;
    position: relative;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
@media screen and (min-width: 501px) {
    .checkbox-wrapper-10 .tgl + .tgl-btn {
        width: 42px;
    }
}
.checkbox-wrapper-10 .tgl + .tgl-btn:after,
.checkbox-wrapper-10 .tgl + .tgl-btn:before {
    position: relative;
    display: block;
    content: "";
    width: 50%;
    height: 100%;
}
.checkbox-wrapper-10 .tgl + .tgl-btn:after {
    left: 0;
}
.checkbox-wrapper-10 .tgl + .tgl-btn:before {
    display: none;
}
.checkbox-wrapper-10 .tgl:checked + .tgl-btn:after {
    left: 50%;
}

.checkbox-wrapper-10 .tgl-flip + .tgl-btn {
    padding: 2px;
    transition: all 0.2s ease;
    font-family: sans-serif;
    perspective: 100px;
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after,
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
    display: inline-block;
    transition: all 0.4s ease;
    width: 100%;
    text-align: center;
    position: absolute;
    line-height: 32px;
    font-weight: bold;
    color: #fff;
    top: 0;
    left: 0;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    border-radius: 4px;
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:after {
    content: attr(data-tg-on);
    background: #02C66F;
    transform: rotateY(-180deg);
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:before {
    background: #1990ff;
    content: attr(data-tg-off);
}
.checkbox-wrapper-10 .tgl-flip + .tgl-btn:active:before {
    transform: rotateY(-20deg);
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:before {
    transform: rotateY(180deg);
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:after {
    transform: rotateY(0);
    left: 0;
    background: #7FC6A6;
}
.checkbox-wrapper-10 .tgl-flip:checked + .tgl-btn:active:after {
    transform: rotateY(20deg);
}
</style>