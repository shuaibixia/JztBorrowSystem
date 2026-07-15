const { getStatusInfo } = require('../../utils/util');

Component({
  properties: {
    status: {
      type: String,
      value: '',
    },
    size: {
      type: String,
      value: 'small',
    },
  },

  data: {
    statusInfo: {},
  },

  observers: {
    status(val) {
      this.setData({ statusInfo: getStatusInfo(val) });
    },
  },

  lifetimes: {
    attached() {
      this.setData({ statusInfo: getStatusInfo(this.data.status) });
    },
  },
});
