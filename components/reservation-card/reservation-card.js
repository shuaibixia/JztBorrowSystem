const { getReservationInfo, formatDate } = require('../../utils/util');

Component({
  properties: {
    reservation: { type: Object, value: {} },
  },

  data: {
    statusInfo: {},
    dateStr: '',
  },

  observers: {
    reservation(val) {
      if (val && val.status) {
        this.setData({
          statusInfo: getReservationInfo(val.status),
          dateStr: `${formatDate(val.startDate, 'MM-DD HH:mm')} ~ ${formatDate(val.endDate, 'MM-DD HH:mm')}`,
        });
      }
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.reservation._id });
    },
  },
});
