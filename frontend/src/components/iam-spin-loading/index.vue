<template>
    <div :class="['bk-spin-loading', `bk-spin-loading-${size}`, `bk-spin-loading-${theme}`, extCls]">
        <div class="rotate rotate1"></div>
        <div class="rotate rotate2"></div>
        <div class="rotate rotate3"></div>
        <div class="rotate rotate4"></div>
        <div class="rotate rotate5"></div>
        <div class="rotate rotate6"></div>
        <div class="rotate rotate7"></div>
        <div class="rotate rotate8"></div>
    </div>
</template>
<script>
    export default {
        name: '',
        props: {
            size: {
                type: String,
                default: 'mini',
                validator: function (value) {
                    return ['large', 'small', 'mini'].includes(value);
                }
            },
            theme: {
                type: String,
                default: 'primary',
                validator: function (value) {
                    return ['primary', 'danger', 'success', 'white', 'warning'].includes(value);
                }
            },
            extCls: {
                type: String,
                default: ''
            }
        }
    };
</script>
<style lang="postcss">
    .bk-spin-loading {
        width: 39px;
        height: 39px;
        position: relative;
        margin: auto;
        display: inline-block;
        vertical-align: middle;
    }

    .bk-spin-loading .rotate {
        position: absolute;
        top: 77%;
        right: 43%;
        background-color: none;
        background-color: #39424e\9\0;
        width: 6px;
        height: 8px;
        transform-origin: 50% -10px;
        border-radius: 8px;
        transform: scale(0.4);
        animation-name: fade;
        animation-duration: 1.2s;
        animation-iteration-count: infinite;
        animation-direction: normal;
    }

    .bk-spin-loading.bk-spin-loading-success .rotate {
        background: #30d878\9\0;
        animation-name: fadeSuccess;
    }

    .bk-spin-loading.bk-spin-loading-danger .rotate {
        background: #ff5656\9\0;
        animation-name: fadeDanger;
    }

    .bk-spin-loading.bk-spin-loading-warning .rotate {
        background: #ffb400\9\0;
        animation-name: fadeWarning;
    }

    .bk-spin-loading.bk-spin-loading-primary .rotate {
        background: #3c96ff\9\0;
        animation-name: fadePrimary;
    }

    .bk-spin-loading.bk-spin-loading-white .rotate {
        background: #fff\9\0;
        animation-name: fadeWhite;
    }

    .bk-spin-loading .rotate1 {
        animation-delay: 0.45s;
        transform: rotate(-90deg);
    }

    .bk-spin-loading .rotate2 {
        animation-delay: 0.6s;
        transform: rotate(-45deg);
    }

    .bk-spin-loading .rotate3 {
        animation-delay: 0.75s;
        transform: rotate(0deg);
    }

    .bk-spin-loading .rotate4 {
        animation-delay: 0.9s;
        transform: rotate(45deg);
    }

    .bk-spin-loading .rotate5 {
        animation-delay: 1.05s;
        transform: rotate(90deg);
    }

    .bk-spin-loading .rotate6 {
        animation-delay: 1.2s;
        transform: rotate(135deg);
    }

    .bk-spin-loading .rotate7 {
        animation-delay: 1.35s;
        transform: rotate(180deg);
    }

    .bk-spin-loading .rotate8 {
        animation-delay: 1.5s;
        transform: rotate(-135deg);
    }

    .bk-spin-loading.bk-spin-loading-large {
        width: 69px;
        height: 69px;
    }

    .bk-spin-loading.bk-spin-loading-large .rotate {
        width: 10px;
        height: 14px;
        transform-origin: 50% -18px;
    }

    .bk-spin-loading.bk-spin-loading-small {
        width: 27px;
        height: 27px;
    }

    .bk-spin-loading.bk-spin-loading-small .rotate {
        width: 4px;
        height: 5px;
        transform-origin: 50% -7px;
    }

    .bk-spin-loading.bk-spin-loading-mini {
        width: 16px;
        height: 16px;
    }

    .bk-spin-loading.bk-spin-loading-mini .rotate {
        width: 2px;
        height: 3px;
        transform-origin: 50% -4px;
    }

    @keyframes fade {
        0% {
            background-color: #39424e;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes fadeSuccess {
        0% {
            background-color: #30d878;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes fadePrimary {
        0% {
            background-color: #3c96ff;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes fadeDanger {
        0% {
            background-color: #ff5656;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes fadeWarning {
        0% {
            background-color: #ffb400;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes fadeWhite {
        0% {
            background-color: white;
        }

        100% {
            background-color: none;
        }
    }

    @keyframes animate {
        0% {
            transform: scale(.5)
        }

        100% {
            transform: scale(.3)
        }
    }
</style>
