<template>
  <!-- eslint-disable max-len -->
  <bk-sideslider
    :is-show="show"
    :title="curTitle"
    :width="960"
    quick-close
    transfer
    ext-cls="iam-aggregate-resource-sideslider-cls"
    @update:isShow="handleCancel"
  >
    <div
      slot="content"
      class="content"
      v-bkloading="{ isLoading: loading, opacity: 1 }"
    >
      <div
        v-if="isShowUnlimited"
        class="no-limited-wrapper flex-between"
        :style="{
          borderBottom: !isHide ? 0 : '',
          marginBottom: isAggregateEmptyMessage ? '10px' : 0
        }"
        :title="$t(`m.resource['无限制总文案']`)"
      >
        <div class="no-limited-wrapper-left single-hide">
          <Icon type="info-new" />
          <span>{{ $t(`m.resource['无限制文案']`) }}</span>
        </div>
        <div class="no-limited-wrapper-right">
          <bk-checkbox
            class="no-limit-checkbox"
            v-model="notLimitValue"
            :disabled="disabled"
            @change="handleLimitChange"
          >
            {{ $t(`m.common['无限制']`) }}
          </bk-checkbox>
        </div>
      </div>
      <div
        v-if="isAggregateEmptyMessage"
        class="no-aggregate-wrapper single-hide"
      >
        <Icon type="info-new" />
        <span>{{ $t(`m.resource['操作之间无公共实例，无法批量编辑']`) }}</span>
      </div>
      <template v-if="!isHide">
        <div class="select-wrapper">
          <div class="left-content">
            <topology-input
              ref="topologyInput"
              :is-filter="isFilter"
              :custom-class="'iam-topology-input-side'"
              :placeholder="curPlaceholder"
              @on-search="handleSearch"
            />
            <div
              class="list-wrapper"
              v-bkloading="{ isLoading: listLoading, opacity: 1 }"
              @scroll="handleScroll"
            >
              <template v-if="!listLoading">
                <p
                  v-for="item in selectList"
                  :key="item.id"
                  :title="item.id"
                  class="item"
                >
                  <bk-checkbox
                    :true-value="true"
                    :false-value="false"
                    v-model="item.checked"
                    @change="handleSelected(...arguments, item)"
                  >
                    {{ item.display_name }}
                  </bk-checkbox>
                </p>
                <div v-if="isScrollBottom" class="loading-item">
                  <div v-bkloading="{ isLoading: true, size: 'mini' }"></div>
                </div>
                <div
                  class="empty-wrapper"
                  v-if="selectList.length < 1 && !listLoading"
                >
                  <ExceptionEmpty
                    :type="emptyData.type"
                    :empty-text="emptyData.text"
                    :tip-text="emptyData.tip"
                    :tip-type="emptyData.tipType"
                    @on-clear="handleEmptyClear"
                    @on-refresh="handleEmptyRefresh"
                  />
                </div>
              </template>
            </div>
          </div>
          <div class="right-content">
            <div class="right-header">
              <span
                :class="[
                  'clear-action',
                  { disabled: curSelectedList.length < 1 }
                ]"
                @click.stop="handleClear"
              >
                {{ $t(`m.common['清空']`) }}
              </span>
            </div>
            <section class="select-list-wrapper">
              <p
                v-for="item in curSelectedList"
                :key="item.id"
                class="selected-item"
              >
                <span class="name" :title="item.id">
                  {{ item.display_name }}
                </span>
                <span class="action" @click.stop="handleRemove(item)">
                  {{ $t(`m.common['移除']`) }}
                </span>
              </p>
              <div class="empty-wrapper" v-if="curSelectedList.length < 1">
                <ExceptionEmpty />
              </div>
            </section>
          </div>
        </div>
        <template v-if="!!attributesList.length">
          <RenderResourceInstance
            type="property"
            mode="edit"
            :selection-mode="selectionMode"
            :need-order="false"
            :is-group="true"
            :disabled="notLimitValue"
            :sub-title="conditionData.attributeTitle"
            :expanded.sync="conditionData.attributeExpanded"
            :hovering="conditionData.isHovering"
            @on-expand="handleAttrExpanded"
            @on-mouseover="handleAttrMouseenter"
            @on-mouseleave="handleAttrMouseLeave"
          >
            <Attribute
              :value="conditionData.attribute"
              :list="attributesList"
              :limit-value="scopeAttrList"
              :params="attributeParams"
              @on-change="handleAttrValueChange"
            />
          </RenderResourceInstance>
        </template>
      </template>
    </div>
    <div slot="footer" class="aggregate-footer">
      <bk-button theme="primary" @click="handleSave">
        {{ $t(`m.common['保存']`) }}
      </bk-button>
      <bk-button @click="handleCancel">
        {{ $t(`m.common['取消']`) }}
      </bk-button>
    </div>
  </bk-sideslider>
</template>

<script>
  import { cloneDeep } from 'lodash';
  import { mapGetters } from 'vuex';
  import { leaveConfirm } from '@/common/leave-confirm';
  import { formatCodeData } from '@/common/util';
  import { firstAttrData } from '@/views/group/add-perm/test';
  import Condition from '@/model/condition';
  import TopologyInput from '@/components/choose-ip/topology-input';
  import Attribute from '@/components/choose-ip/aggregate-attribute';
  import RenderResourceInstance from '@/components/render-resource';

  export default {
    name: '',
    components: {
      TopologyInput,
      Attribute,
      RenderResourceInstance
    },
    props: {
      show: {
        type: Boolean,
        default: false
      },
      value: {
        type: Array,
        default: () => []
      },
      attrValue: {
        type: Array,
        default: () => []
      },
      data: {
        type: Array,
        default: () => []
      },
      originalData: {
        type: Array,
        default: () => []
      },
      params: {
        type: Object,
        default: () => {
          return {};
        }
      },
      defaultList: {
        type: Array,
        default: () => []
      },
      isSuperManager: {
        type: Boolean,
        default: () => true
      },
      flag: {
        type: String,
        default: ''
      },
      disabled: {
        type: Boolean,
        default: false
      },
      selectionMode: {
        type: String,
        default: 'all'
      },
      isAggregateEmptyMessage: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        pagination: {
          current: 1,
          totalPage: 0,
          limit: 23
        },
        selectList: [],
        attributesList: [],
        curSelectedList: [],
        curSelectedIds: [],
        scopeAttrList: [],
        searchValue: '',
        loading: false,
        isFilter: false,
        listLoading: true,
        isScrollBottom: false,
        isHide: false,
        notLimitValue: false,
        noLimitRoutes: ['createUserGroup', 'cloneUserGroup', 'addGroupPerm'], // 需要展示无限制的页面
        emptyData: {
          type: 'empty',
          text: '暂无数据',
          tip: '',
          tipType: ''
        },
        // 实例化类获取实例成员
        conditionData: new Condition({ selection_mode: this.selectionMode }, 'init', 'add'),
        isAny: false,
        isUnlimited: false,
        pageChangeAlertMemo: false
      };
    },
    computed: {
      ...mapGetters(['user']),
      curPlaceholder () {
        if (this.params.name) {
          return `${this.$t(`m.common['搜索']`)} ${this.params.name}`;
        }
        return '';
      },
      attributeParams () {
        if (Object.keys(this.params).length > 0) {
          const { curAggregateSystemId, id } = this.params;
          return {
            system_id: curAggregateSystemId,
            type: id
          };
        }
        return {};
      },
      curTitle () {
        if (this.params.name) {
          return `${this.$t(`m.common['选择']`)} ${this.params.name}`;
        }
        return '';
      },
      isHasDefaultData () {
        return this.defaultList.length > 0;
      },
      isShowUnlimited () {
        const result
          = ['applyCustomPerm'].includes(this.$route.name)
          || (['super_manager', 'system_manager'].includes(this.user.role.type)
            && this.noLimitRoutes.includes(this.$route.name));
        return result;
      },
      isAllSelectionMode () {
        return this.selectList.length > 0 && this.attributesList.length > 0;
      }
    },
    watch: {
      show: {
        async handler (value) {
          if (value) {
            this.listLoading = true;
            this.pageChangeAlertMemo = window.changeAlert;
            window.changeAlert = 'iamSidesider';
            // 为了减少组件之间数据传递的代码量，这里再重新调用一次接口做任意类型数据的处理
            if (this.params.curAggregateSystemId) {
              await this.fetchAuthorizationScopeActions(
                this.params.curAggregateSystemId
              );
            }
            if ((this.isSuperManager && !this.isHasDefaultData)
              || this.isAny
              || this.isUnlimited
            ) {
              Promise.all([this.fetchData(false, true), this.fetchResourceAttrs()]);
            } else {
              this.setSelectList(this.defaultList);
            }
          } else {
            window.changeAlert = this.pageChangeAlertMemo;
          }
        },
        immediate: true
      },
      value: {
        handler (value) {
          this.curSelectedList = cloneDeep(value);
        },
        deep: true
      },
      attrValue: {
        handler (value) {
          this.conditionData.attribute = cloneDeep(value);
          if (value.length) {
            this.conditionData.attributeExpanded = true;
          }
        },
        deep: true
      },
      curSelectedList: {
        handler (value) {
          this.curSelectedIds = value.map((item) => item.id);
        },
        immediate: true
      },
      params: {
        handler (value) {
          if (Object.keys(value).length) {
            const { isNoLimited } = value;
            // isNoLimited代表是否是无限制，无限制则需要
            [this.notLimitValue, this.isHide] = [isNoLimited, isNoLimited];
            if (isNoLimited) {
              this.handleClear();
            }
            this.$emit('on-init', false);
          }
        },
        immediate: true
      },
      notLimitValue (value) {
        if (value) {
          this.conditionData = Object.assign(this.conditionData, {
            isInstanceEmpty: false,
            isAttributeEmpty: false
          });
        }
      }
    },
    methods: {
      async fetchData (isLoading = false, listLoading = false) {
        this.loading = isLoading;
        this.listLoading = listLoading;
        const params = {
          keyword: this.searchValue,
          limit: this.pagination.limit,
          offset: this.pagination.limit * (this.pagination.current - 1),
          ancestors: [],
          system_id: this.params.system_id,
          action_system_id: this.params.system_id,
          action_id: '',
          type: this.params.id
        };
        try {
          const { code, data } = await this.$store.dispatch(
            'permApply/getResources',
            params
          );
          this.pagination.totalPage = Math.ceil(
            data.count / this.pagination.limit
          );
          this.selectList = data.results || [];
          this.selectList.forEach((item) => {
            item.checked = this.curSelectedIds.includes(item.id);
          });
          this.emptyData = formatCodeData(
            code,
            this.emptyData,
            data.results.length === 0
          );
        } catch (e) {
          this.emptyData = formatCodeData(e.code, this.emptyData);
          this.resetData();
          this.messageAdvancedError(e);
        } finally {
          this.loading = false;
          this.listLoading = false;
        }
      },

      // 获取资源属性
      async fetchResourceAttrs () {
        try {
          // const { data } = await this.$store.dispatch('permApply/getResourceAttrs', this.attributeParams);
          const { data } = await firstAttrData;
          this.attributesList = [...data.results || []];
        } catch (e) {
          this.messageAdvancedError(e);
        }
      },

      async fetchAuthorizationScopeActions (id) {
        try {
          const { data } = await this.$store.dispatch(
            'permTemplate/getAuthorizationScopeActions',
            {
              systemId: id
            }
          );
          // 判断是否是任意
          this.isAny = data && data.some((item) => item.id === '*');
          if (this.params.actionsId && data.length) {
            const curActions = data.filter((item) =>
              this.params.actionsId.includes(item.id)
            );
            if (curActions.length) {
              // 判断操作是否都是无限制
              this.isUnlimited = curActions.every(
                (item) =>
                  item.resource_groups
                  && item.resource_groups.length
                  && item.resource_groups[0].related_resource_types.length
                  && item.resource_groups[0].related_resource_types[0].condition
                    .length === 0
              );
            }
          }
        } catch (e) {
          this.messageAdvancedError(e);
        }
      },

      async handleScroll (event) {
        if (this.isScrollBottom || this.isHasDefaultData) {
          return;
        }
        if (
          event.target.scrollTop + event.target.offsetHeight
          >= event.target.scrollHeight - 5
        ) {
          window.changeAlert = true;
          ++this.pagination.current;
          if (this.pagination.current <= this.pagination.totalPage) {
            this.isScrollBottom = true;
            const params = {
              keyword: this.searchValue,
              limit: this.pagination.limit,
              offset: this.pagination.limit * (this.pagination.current - 1),
              ancestors: [],
              system_id: this.params.system_id,
              action_system_id: this.params.system_id,
              action_id: '',
              type: this.params.id
            };
            try {
              const res = await this.$store.dispatch(
                'permApply/getResources',
                params
              );
              this.pagination.totalPage = Math.ceil(
                res.data.count / this.pagination.limit
              );
              (res.data.results || []).forEach((item) => {
                item.checked = this.curSelectedIds.includes(item.id);
              });
              this.selectList.push(...(res.data.results || []));
            } catch (e) {
              this.messageAdvancedError(e);
            } finally {
              this.isScrollBottom = false;
              event.target.scrollTo(0, event.target.scrollTop - 1);
            }
          }
        } else {
          this.isScrollBottom = false;
        }
      },

      async handleSearch (payload) {
        window.changeAlert = true;
        this.searchValue = payload;
        this.emptyData.tipType = 'search';
        this.isFilter = !(this.isFilter && !payload);
        this.pagination = Object.assign(
          {},
          {
            current: 1,
            totalPage: 0,
            limit: 23
          }
        );
        if (this.isHasDefaultData) {
          this.setSearchData();
          return;
        }
        this.fetchData(false, true);
      },

      async setSelectList (payload) {
        const setData = async () => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(payload);
            }, 300);
          });
        };
        this.listLoading = true;
        try {
          const res = await setData();
          this.selectList = cloneDeep(res);
          this.selectList.forEach((item) => {
            item.checked = this.curSelectedIds.includes(item.id);
          });
        } catch (e) {
          this.messageAdvancedError(e);
        } finally {
          this.listLoading = false;
        }
      },

      handleLimitChange (newVal) {
        window.changeAlert = true;
        this.isHide = newVal;
        if (!this.flag) {
          this.$emit('on-limit-change');
        }
      },

      handleAttrValueChange (payload) {
        window.changeAlert = true;
        this.conditionData = Object.assign(this.conditionData, {
          isAttributeEmpty: false,
          attribute: [...payload]
        });
      },

      setSearchData () {
        let templateList = this.defaultList;
        if (this.searchValue !== '') {
          templateList = this.defaultList.filter(
            (item) => item.display_name.indexOf(this.searchValue) > -1
          );
        }
        this.setSelectList(templateList);
      },

      handleClear () {
        window.changeAlert = true;
        this.curSelectedList = [];
        this.selectList.forEach((item) => {
          item.checked = false;
        });
      },

      handleRemove ({ id }) {
        window.changeAlert = true;
        this.curSelectedList = this.curSelectedList.filter(
          (item) => item.id !== id
        );
        const len = this.selectList.length;
        for (let i = 0; i < len; i++) {
          if (this.selectList[i].id === id) {
            this.selectList[i].checked = false;
            break;
          }
        }
      },

      handleSelected (value, trueValue, falseValue, payload) {
        window.changeAlert = true;
        if (value) {
          this.curSelectedList.push({ ...payload });
        } else {
          this.curSelectedList = this.curSelectedList.filter(
            (item) => item.id !== payload.id
          );
        }
      },
      
      handleAttrExpanded (payload) {
        this.conditionData.attributeExpanded = !payload;
      },

      handleAttrMouseenter () {
        this.conditionData.isHovering = true;
      },

      handleAttrMouseLeave () {
        this.conditionData.isHovering = false;
      },

      handleGetValue () {
        const tempConditionData = {
          instances: this.curSelectedList,
          attributes: this.conditionData.attribute
        };
        if (this.notLimitValue) {
          return {
            isEmpty: false,
            data: []
          };
        }
        if (!tempConditionData.instances.length && !tempConditionData.attributes.length) {
          return {
            isEmpty: false,
            data: ['none']
          };
        }
        // 属性判断是否都选择了
        tempConditionData.attributes = tempConditionData.attributes.filter((item) => item.values && item.values.some((v) => v.id !== ''));
        return {
          isEmpty: false,
          data: [tempConditionData]
        };
      },

      handleEmptyClear () {
        this.$refs.topologyInput.value = '';
        this.emptyData.tipType = '';
        this.resetData();
        this.fetchData();
      },

      handleEmptyRefresh () {
        this.resetData();
        this.fetchData();
      },

      resetData () {
        this.pagination = Object.assign(
          {},
          {
            current: 1,
            totalPage: 0,
            limit: 23
          }
        );
        this.searchValue = '';
        this.curSelectedList = [];
        this.selectList = [];
        this.attributesList = [];
        this.conditionData.attribute = [];
        this.isScrollBottom = false;
      },

      handleSave () {
        window.changeAlert = false;
        if (this.notLimitValue) {
          this.curSelectedList = [];
          this.conditionData.attribute = [];
          this.selectList.forEach((item) => {
            item.checked = false;
          });
        }
        const saveParams = {
          instances: this.curSelectedList,
          attributes: this.conditionData.attribute || []
        };
        if (saveParams.attributes.length) {
          // 查询有属性条件存在时是否数据完全
          const attrEmptyIndex = saveParams.attributes.findIndex((item) => item.values.length === 0);
          if (attrEmptyIndex > -1) {
            this.messageWarn(this.$t(`m.info['第几项属性不能为空']`, { value: attrEmptyIndex + 1 }), 3000);
            return;
          }
        }
        this.$emit('update:show', false);
        this.$emit('on-selected', saveParams);
        this.resetData();
      },

      handleCancel () {
        let cancelHandler = Promise.resolve();
        if (window.changeAlert) {
          cancelHandler = leaveConfirm();
        }
        cancelHandler.then(
          () => {
            this.$emit('update:show', false);
            this.resetData();
          },
          (_) => _
        );
      }
    }
  };
</script>

<style lang="postcss" scoped>
.iam-aggregate-resource-sideslider-cls {
  .content {
    padding: 20px 25px;
    height: calc(100vh - 114px);
  }
  .select-wrapper {
    width: 100%;
    height: 480px;
    display: flex;
    justify-self: start;
    border-top: 1px solid #dcdee5;
  }
  .no-limited-wrapper,
  /deep/ .no-aggregate-wrapper {
    width: 100%;
    height: 42px;
    line-height: 39px;
    font-size: 12px;
    color: #63656e;
    background-color: #fafbfd;
    border: 1px solid #dcdee5;
    padding: 0 21px 0 13px;
    &-left {
      max-width: calc(100% - 100px);
    }
    &-right {
      .no-limit-checkbox {
        /deep/ .bk-checkbox-text {
          font-size: 12px;
        }
      }
    }
  }
  .no-aggregate-wrapper {
    border-bottom: 0;
  }
  .left-content {
    width: 360px;
    border-bottom: 1px solid #dcdee5;
    border-left: 1px solid #dcdee5;
    .list-wrapper {
      position: relative;
      min-height: 446px;
      padding: 5px 10px;
      height: calc(100% - 32px);
      overflow: auto;
      /*滚动条整体样式*/
      &::-webkit-scrollbar {
        width: 6px; /*竖向滚动条的宽度*/
        height: 6px; /*横向滚动条的高度*/
      }
      /*滚动条里面的小方块*/
      &::-webkit-scrollbar-thumb {
        background: #dcdee5;
        border-radius: 3px;
      }
      /*滚动条轨道的样式*/
      &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
      }
      .item {
        line-height: 24px;
        /deep/ .bk-checkbox-text {
          font-size: 12px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .loading-item {
        line-height: 20px;
      }
      .empty-wrapper {
        width: 300px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }
  .right-content {
    position: relative;
    width: 560px;
    border: 1px solid #dcdee5;
    border-top: none;
    .right-header {
      position: relative;
      padding: 0 10px;
      height: 32px;
      line-height: 32px;
      font-size: 14px;
      border-bottom: 1px solid #dcdee5;
      .clear-action {
        position: absolute;
        right: 10px;
        font-size: 12px;
        color: #3a84ff;
        cursor: pointer;
        &:hover {
          color: #699df4;
        }
        &.disabled {
          color: #c4c6cc;
          cursor: not-allowed;
        }
      }
    }
    .select-list-wrapper {
      height: calc(100% - 32px);
      overflow: auto;
      /*滚动条整体样式*/
      &::-webkit-scrollbar {
        width: 6px; /*竖向滚动条的宽度*/
        height: 6px; /*横向滚动条的高度*/
      }
      /*滚动条里面的小方块*/
      &::-webkit-scrollbar-thumb {
        background: #dcdee5;
        border-radius: 3px;
      }
      /*滚动条轨道的样式*/
      &::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
      }
    }
    .selected-item {
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
      line-height: 32px;
      font-size: 12px;
      border-bottom: 1px solid #dcdee5;
      .name {
        /* max-width: 400px; */
        max-width: 470px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .action {
        color: #3a84ff;
        cursor: pointer;
        &:hover {
          color: #699df4;
        }
      }
    }
    .empty-wrapper {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      img {
        width: 120px;
      }
    }
  }
}
  /deep/ .bk-sideslider-footer {
    background-color: #ffffff !important;
    border-color: #dcdee5 !important;
    .aggregate-footer {
      margin-left: 25px;
      line-height: 48px;
      .bk-button {
        margin-right: 8px;
      }
    }
  }
</style>
