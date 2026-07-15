const { getStatusInfo, getCategoryInfo } = require('../../utils/util');

Component({
  properties: {
    equipment: {
      type: Object,
      value: {},
    },
  },

  data: {
    statusInfo: {},
    categoryInfo: {},
  },

  observers: {
    equipment(val) {
      if (val && val.status) {
        this.setData({
          statusInfo: getStatusInfo(val.status),
          categoryInfo: getCategoryInfo(val.category),
        });
      }
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.equipment._id });
    },
  },
});
