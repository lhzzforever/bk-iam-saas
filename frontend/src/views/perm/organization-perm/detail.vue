<template>
    <div class="iam-my-perm">
        <template v-if="orgTemplateList.length">
            <render-perm-item
                v-for="(orgTemplate, orgTemplateIndex) in orgTemplateList"
                :key="orgTemplate.id"
                :expanded.sync="orgTemplate.expanded"
                :ext-cls="orgTemplateIndex > 0 ? 'iam-perm-ext-cls' : ''"
                :title="orgTemplate.displayName"
                @on-expanded="handleExpanded(...arguments, orgTemplate)">
                <detail-table :template-id="orgTemplate.id" :system-id="orgTemplate.system.id"
                    :version="orgTemplate.version" />
            </render-perm-item>
        </template>
        <template v-else>
            <div class="iam-my-perm-empty-wrapper">
                <iam-svg />
            </div>
        </template>
    </div>
</template>
<script>
    import RenderPermItem from './render-perm';
    import DetailTable from './detail-table';

    export default {
        name: '',
        components: {
            RenderPermItem,
            DetailTable
        },
        data () {
            return {
                orgTemplateList: []
            };
        },
        computed: {
            orgId () {
                return this.$route.params.id;
            },
            groupName () {
                return this.$route.params.name;
            }
        },
        created () {
            const params = this.$route.params;
            if (!params.id || !params.name) {
                this.$router.push({
                    name: 'myPerm',
                    query: this.$route.query,
                    params
                });
                return;
            }
            this.$store.commit('setHeaderTitle', `${this.$t(`m.perm['加入的组织']`)}【${this.groupName}】${this.$t(`m.perm['的权限']`)}`);
            this.$store.commit('setBackRouter', -1);
        },
        methods: {
            /**
             * 获取页面数据
             */
            async fetchPageData () {
                await this.fetchGroupTemplates();
            },

            /**
             * 展开/收起 系统下的权限列表
             *
             * @param {Boolean} value 展开收起标识
             * @param {Object} payload 当前系统
             */
            async handleExpanded (value, payload) { },

            /**
             * 用户组拥有的权限模板列表
             */
            async fetchGroupTemplates () {
                try {
                    const res = await this.$store.dispatch('perm/getOrgTemplates', {
                        subjectId: this.orgId,
                        subjectType: 'department'
                    });
                    const data = res.data || [];
                    data.forEach(item => {
                        item.displayName = `${item.name}（${item.system.name}）`;
                        item.expanded = false;
                    });
                    this.orgTemplateList.splice(0, this.orgTemplateList.length, ...data);
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
    .iam-my-perm {
        .iam-perm-ext-cls {
            margin-top: 10px;
        }
        .iam-my-perm-empty-wrapper {
            img {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 120px;
            }
        }
    }
</style>
