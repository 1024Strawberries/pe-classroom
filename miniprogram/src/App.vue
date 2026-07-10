<script>
export default {
  onLaunch() {},
};
</script>

<style>
page {
  min-height: 100%;
  color: #17202f;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
input,
button,
picker {
  box-sizing: border-box;
}

button {
  margin: 0;
  border-radius: 8px;
}

button::after {
  border: 0;
}

.page {
  min-height: 100vh;
  padding: 24rpx;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.panel {
  padding: 28rpx;
  border: 1rpx solid #e1e6ee;
  border-radius: 12rpx;
  background: #fff;
}

.title {
  display: block;
  margin-bottom: 20rpx;
  color: #17202f;
  font-size: 34rpx;
  font-weight: 800;
}

.muted {
  color: #667085;
  font-size: 26rpx;
  line-height: 1.5;
}

.input {
  width: 100%;
  min-height: 92rpx;
  padding: 0 24rpx;
  border: 1rpx solid #d7dde5;
  border-radius: 10rpx;
  color: #17202f;
  background: #fff;
  font-size: 30rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.label {
  color: #344054;
  font-size: 26rpx;
  font-weight: 700;
}

.btn {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #d7dde5;
  color: #17202f;
  background: #fff;
  font-size: 30rpx;
  font-weight: 700;
}

.primary {
  border-color: #1f7a64;
  color: #fff;
  background: #1f7a64;
}

.danger {
  border-color: #c2410c;
  color: #fff;
  background: #c2410c;
}

.row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.row > view,
.row > button,
.row > input {
  flex: 1;
}

.card {
  min-height: 420rpx;
  padding: 34rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  border-radius: 12rpx;
  color: #fff;
  background: linear-gradient(155deg, #1f4d46, #256b7b);
}

.student-no {
  color: rgba(255, 255, 255, .82);
  font-size: 34rpx;
}

.student-name {
  color: #fff;
  font-size: 76rpx;
  font-weight: 900;
  line-height: 1.1;
}

.student-class {
  color: rgba(255, 255, 255, .82);
  font-size: 32rpx;
}
</style>
