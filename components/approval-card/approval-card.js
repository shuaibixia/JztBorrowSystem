const { getApprovalInfo, formatRelativeTime } = require('../../utils/util');

Component({
  properties: {
    approval: { type: Object, value: {} },
  },

  data: {
    statusInfo: {},
    timeStr: '',
  },

  observers: {
    approval(val) {
      if (val && val.status) {
        this.setData({
          statusInfo: getApprovalInfo(val.status),
          timeStr: formatRelativeTime(val.createdAt),
        });
      }
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.approval._id });
    },
  },
});
