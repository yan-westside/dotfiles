// Polyfill SlowBuffer for Node.js 23+ compatibility.
// The buffer-equal-constant-time package (jwa -> jws -> google-auth-library)
// accesses SlowBuffer.prototype at module load time, but SlowBuffer was
// deprecated in Node 6 and removed in Node 23.
import buffer from 'node:buffer';

if (!(buffer as any).SlowBuffer) {
  const { Buffer } = buffer;
  const SlowBuffer = function SlowBuffer(length: number) {
    return Buffer.allocUnsafeSlow(length);
  } as unknown as typeof Buffer;
  Object.setPrototypeOf(SlowBuffer.prototype, Buffer.prototype);
  (buffer as any).SlowBuffer = SlowBuffer;
}
