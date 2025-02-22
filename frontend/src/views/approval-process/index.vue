<template>
    <div class="iam-approval-process-set-wrapper">
        <section class="iam-approval-process-set-item-wrapper" v-if="isSuperManager">
            <render-set-item
                v-for="(item, index) in processSetList"
                :key="item.process_id"
                :ref="`${index}SetRef`"
                :class="index > 0 ? 'set-margin-left' : ''"
                :cur-value="item.process_id"
                :title="item.title"
                :list="processData[item.type]"
                @selected="handleSelected(...arguments, item, index)" />
        </section>
        <section :class="['iam-approval-process-set-content-wrapper', { 'set-style': isSuperManager }]">
            <bk-tab
                :active.sync="active"
                type="unborder-card"
                ext-cls="iam-approval-process-set-tab-cls">
                <bk-tab-panel
                    v-for="(panel, index) in panels"
                    v-bind="panel"
                    :key="index">
                </bk-tab-panel>
                <component
                    :is="active"
                    :list="processData[activeMap[active]]" />
            </bk-tab>
        </section>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';
    import RenderSetItem from './common/render-process-item';
    import JoinRateManagerProcess from './components/join-rate-manager-process';
    import JoinGroupProcess from './components/join-group-process';
    import CustomPermProcess from './components/custom-perm-process';
    import CreateRateManagerProcess from './components/create-rate-manager-process';

    /**
     * ACTIVE_COMPONENT_MAP
     */
    const ACTIVE_COMPONENT_MAP = {
        'CustomPermProcess': 'grant_action',
        'JoinGroupProcess': 'join_group',
        'JoinRateManagerProcess': 'create_rating_manager',
        'CreateRateManagerProcess': 'alter_rating_manager'
    };

    export default {
        components: {
            RenderSetItem,
            JoinRateManagerProcess,
            JoinGroupProcess,
            CustomPermProcess,
            CreateRateManagerProcess
        },
        data () {
            return {
                processSetList: [
                    {
                        title: this.$t(`m.approvalProcess['自定义权限']`),
                        isOpen: false,
                        process_id: '',
                        type: 'grant_action'
                    },
                    {
                        title: this.$t(`m.approvalProcess['加入用户组']`),
                        isOpen: false,
                        process_id: '',
                        type: 'join_group'
                    },
                    {
                        title: this.$t(`m.approvalProcess['创建分级管理员']`),
                        isOpen: false,
                        value: '3',
                        type: 'create_rating_manager'
                    }
                ],
                panels: [
                    { name: 'CustomPermProcess', label: this.$t(`m.approvalProcess['自定义权限审批流程']`) },
                    { name: 'JoinGroupProcess', label: this.$t(`m.approvalProcess['加入用户组审批流程']`) }
                ],
                active: 'CustomPermProcess',
                curRole: 'staff',
                processData: {
                    'grant_action': [],
                    'join_group': [],
                    'create_rating_manager': []
                    // 'alter_rating_manager': []
                },
                activeMap: ACTIVE_COMPONENT_MAP
            };
        },
        computed: {
            ...mapGetters(['user']),
            /**
             * isSuperManager
             */
            isSuperManager () {
                return this.curRole === 'super_manager';
            }
        },
        watch: {
            /**
             * user
             */
            user: {
                handler (value) {
                    this.curRole = value.role.type || 'staff';
                    this.getFilterPanels();
                },
                immediate: true
            }
        },
        created () {
            this.curRole = this.user.role.type || 'staff';
            this.getFilterPanels();
        },
        methods: {
            /**
             * 111
             */
            async fetchPageData () {
                if (this.curRole === 'system_manager') {
                    await Promise.all([
                        this.fetchProcesses('grant_action'),
                        this.fetchProcesses('join_group')
                    ]);
                } else if (this.curRole === 'rating_manager') {
                    await this.fetchProcesses('join_group');
                } else {
                    await Promise.all([
                        this.fetchProcesses('grant_action'),
                        this.fetchProcesses('join_group'),
                        this.fetchProcesses('create_rating_manager'),
                        this.fetchDefaultProcesses()
                    ]);
                }
            },

            /**
             * fetchProcesses
             */
            async fetchProcesses (type) {
                try {
                    const res = await this.$store.dispatch('approvalProcess/getProcessesList', { type });
                    this.processData[type] = Object.freeze(res.data);
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                }
            },

            /**
             * fetchDefaultProcesses
             */
            async fetchDefaultProcesses () {
                try {
                    const res = await this.$store.dispatch('approvalProcess/getDefaultProcesses');
                    const defaultProcesses = res.data || [];
                    const grantAction = defaultProcesses.find(item => item.type === 'grant_action');
                    if (grantAction) {
                        this.processSetList[0].process_id = grantAction.process_id;
                    }
                    const joinGroup = defaultProcesses.find(item => item.type === 'join_group');
                    if (joinGroup) {
                        this.processSetList[1].process_id = joinGroup.process_id;
                    }
                    const createRatingManager = defaultProcesses.find(item => item.type === 'create_rating_manager');
                    if (createRatingManager) {
                        this.processSetList[2].process_id = createRatingManager.process_id;
                    }
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                }
            },

            /**
             * getFilterPanels
             */
            getFilterPanels () {
                switch (this.curRole) {
                    case 'system_manager':
                        this.panels = this.panels.filter(item => ['CustomPermProcess', 'JoinGroupProcess'].includes(item.name));
                        this.active = 'CustomPermProcess';
                        break;
                    case 'rating_manager':
                        this.panels = this.panels.filter(item => ['JoinRateManagerProcess', 'JoinGroupProcess'].includes(item.name));
                        this.active = 'JoinGroupProcess';
                        break;
                    default:
                        this.active = 'CustomPermProcess';
                }
            },

            /**
             * handleSelected
             */
            async handleSelected (payload, item, index) {
                try {
                    await this.$store.dispatch('approvalProcess/updateDefaultProcesses', {
                        type: item.type,
                        process_id: payload
                    });
                    item.process_id = payload;
                    this.$refs[`${index}SetRef`][0] && this.$refs[`${index}SetRef`][0].setValue(item.process_id);
                    this.messageSuccess(this.$t(`m.common['操作成功']`));
                } catch (e) {
                    console.error(e);
                    this.bkMessageInstance = this.$bkMessage({
                        limit: 1,
                        theme: 'error',
                        message: e.message || e.data.msg || e.statusText,
                        ellipsisLine: 2,
                        ellipsisCopy: true
                    });
                }
            }
        }
    };
</script>
<style lang="postcss">
    .iam-approval-process-set-wrapper {
        padding: 20px;
        .iam-approval-process-set-item-wrapper {
            display: flex;
            justify-content: flex-start;
            .set-margin-left {
                margin-left: 16px;
            }
        }
        .iam-approval-process-set-content-wrapper {
            min-height: calc(100vh - 101px);
            background: #fff;
            border-radius: 2px;
            box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, .05);
            &.set-style {
                margin-top: 20px;
                min-height: calc(100vh - 250px);
            }
            .iam-approval-process-set-tab-cls {
                .bk-tab-header {
                    height: 60px;
                    background-image: linear-gradient(transparent 59px, #dcdee5 0);
                    .bk-tab-header-setting {
                        height: 60px;
                        line-height: 60px;
                    }
                    .bk-tab-label-list {
                        height: 60px;
                        .bk-tab-label-item {
                            line-height: 60px;
                        }
                    }
                }
            }
        }
    }
</style>
