<template>
    <div :class="['iam-condition-item', { active: isActive }, { error: isError }]"
        @mouseenter="handleMouseenter"
        @mouseleave="handleMouseleave"
        @click.stop="handleClick">
        <div class="iam-input-text" :style="style" :title="!isEmpty ? curValue : ''" @click.stop="handleClick">
            <section :class="['iam-condition-input', { 'is-empty': isEmpty }]" @click.stop="handleClick">
                {{ curValue }}
            </section>
        </div>
        <div class="operate-icon"
            :title="$t(`m.common['预览']`)"
            v-if="canView && canOperate"
            @click.stop="handleView">
            <Icon type="see-details" />
        </div>
        <div class="operate-icon"
            :title="$t(`m.common['复制']`)"
            v-if="!isEmpty && canOperate && canCopy"
            @click.stop="handleCopy">
            <Icon type="copy" />
        </div>
        <div class="operate-icon paste-icon"
            :title="$t(`m.common['粘贴']`)"
            v-if="canOperate && canPaste"
            @click.stop="handlePaste">
            <spin-loading v-if="pasteLoading" />
            <Icon v-else type="paste" />
        </div>

        <!-- 批量粘贴 -->
        <div class="operate-icon"
            :title="$t(`m.common['批量粘贴']`)"
            @mouseenter="iconEnter = true"
            @mouseleave="iconEnter = false"
            @click.stop="handleBatchPaste"
            v-if="(canOperate && canPaste) || immediatelyShow">
            <iam-svg v-if="!iconEnter" name="brush-fill" />
            <iam-svg v-else name="brush-fill-active" />
        </div>
    </div>
</template>
<script>
    export default {
        name: '',
        props: {
            value: {
                type: String,
                default: ''
            },
            isEmpty: {
                type: Boolean,
                default: false
            },
            canView: {
                type: Boolean,
                default: false
            },
            canPaste: {
                type: Boolean,
                default: false
            },
            canOperate: {
                type: Boolean,
                default: true
            },
            canCopy: {
                type: Boolean,
                default: true
            },
            isError: {
                type: Boolean,
                default: false
            },
            params: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        },
        data () {
            return {
                curValue: '',
                isActive: false,
                immediatelyShow: false,
                isLoading: false,
                pasteLoading: false,
                iconEnter: false
            };
        },
        computed: {
            style () {
                const statusLen = [this.canView, this.canPaste, this.canCopy].filter(status => !!status).length;
                return {
                    width: `calc(100% - ${statusLen * 20}px)`
                };
            },
            isDisabled () {
                return this.isLoading || this.pasteLoading;
            }
        },
        watch: {
            value: {
                handler (val) {
                    this.curValue = val;
                },
                immediate: true
            }
        },
        methods: {
            handleView () {
                this.$emit('on-view');
            },

            handleCopy () {
                this.$emit('on-copy');
            },

            handleClick () {
                if (this.isDisabled) {
                    return;
                }
                this.$emit('on-click');
            },

            handleMouseenter () {
                this.isActive = true;
                this.$emit('on-mouseover');
            },

            handleMouseleave () {
                this.isActive = false;
                this.immediatelyShow = false;
                this.$emit('on-mouseleave');
            },

            async handlePaste () {
                // 无限制时无需请求接口
                if (Object.keys(this.params).length < 1) {
                    this.$emit('on-paste');
                    return;
                }
                if (this.params.resource_type.condition.length === 0) {
                    this.$emit('on-paste', {
                        flag: true,
                        data: []
                    });
                    return;
                }
                this.pasteLoading = true;
                const params = {
                    resource_type: this.params.resource_type,
                    actions: this.params.actions.slice(0, 1)
                };
                try {
                    const res = await this.$store.dispatch('permApply/resourceBatchCopy', params);
                    console.warn(res);
                    const condition = res.data[0].resource_type.condition;
                    this.$emit('on-paste', {
                        flag: true,
                        data: condition
                    });
                } catch (e) {
                    this.$emit('on-paste', {
                        flag: false,
                        data: null
                    });
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                } finally {
                    this.pasteLoading = false;
                }
            },

            async handleBatchPaste () {
                if (Object.keys(this.params).length < 1) {
                    this.$emit('on-batch-paste');
                    return;
                }
                // 无限制时无需请求接口
                if (this.params.resource_type.condition.length === 0) {
                    this.$emit('on-batch-paste', {
                        flag: true,
                        data: []
                    });
                    return;
                }
                this.isLoading = true;
                try {
                    const res = await this.$store.dispatch('permApply/resourceBatchCopy', this.params);
                    this.$emit('on-batch-paste', {
                        flag: true,
                        data: res.data
                    });
                } catch (e) {
                    this.$emit('on-batch-paste', {
                        flag: false,
                        data: null
                    });
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                } finally {
                    this.isLoading = false;
                }
            },

            setImmediatelyShow (payload) {
                this.immediatelyShow = !!payload;
            }
        }
    };
</script>
<style lang="postcss" scoped>
    .iam-condition-item {
        display: flex;
        justify-content: flex-start;
        position: relative;
        padding: 0 6px;
        width: 90%;
        line-height: 1;
        vertical-align: middle;
        border: 1px solid #c4c6cc;
        border-radius: 2px;
        font-size: 0;
        color: #63656e;
        background: #fff;
        cursor: pointer;
        &:hover {
            border-color: #3a84ff;
            .operate-icon {
                visibility: visible;
            }
        }
        &.active {
            border-color: #3a84ff;
        }
        &.error {
            border-color: #ff5656;
        }
        .iam-input-text {
            .iam-condition-input {
                height: 32px;
                line-height: 32px;
                background-color: #fff;
                width: 100%;
                font-size: 12px;
                box-sizing: border-box;
                border: none;
                text-align: left;
                vertical-align: middle;
                outline: none;
                resize: none;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
                &.is-empty {
                    color: #c4c6cc;
                }
            }
        }
        .original-resource-icon {
            padding-top: 6px;
            outline: none;
            cursor: pointer;
            img {
                width: 20px;
            }
        }
        .operate-icon {
            display: inline-block;
            visibility: hidden;
            margin: 6px 0 0 6px;
            padding: 2px;
            width: 20px;
            height: 20px;
            color: #979ba5;
            outline: none;
            cursor: pointer;
            &:hover {
                color: #3a84ff;
                border-radius: 2px;
                background: #e1ecff;
                i {
                    color: #3a84ff;
                }
            }
            &.paste-icon {
                visibility: visible;
            }
            i {
                font-size: 16px;
                color: #979ba5;
            }
        }
        .iam-condition-batch-paste {
            position: absolute;
            right: -65px;
            top: 0px;
            width: 71px;
            height: 32px;
            line-height: 30px;
            text-align: center;
            background: #fff;
            border: 1px solid #dcdee5;
            box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, .1);
            z-index: 999999;
            .batch-paste-wrapper {
                position: relative;
                height: 38px;
                background: transparent;
            }
            .batch-paste-action {
                line-height: 25px;
                background: #fff;
            }
            .triangle {
                position: absolute;
                left: -5px;
                bottom: 18px;
                width: 10px;
                height: 10px;
                background: #fff;
                transform: rotate(45deg);
                border-bottom: 1px solid #dcdee5;
                border-right: 1px solid #dcdee5;
                z-index: -1;
            }
        }
    }
</style>
