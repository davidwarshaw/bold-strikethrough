function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(0);
    }, duration);
  });
}

function tween(scene, config) {
  return new Promise((resolve) => {
    config.onComplete = resolve;
    scene.tweens.add(config);
  });
}

function timer(scene, config) {
  return new Promise((resolve) => {
    config.callback = resolve;
    scene.time.addEvent(config);
  });
}

async function sequential(promises) {
  for (const nextPromise of promises) {
    await nextPromise();
  }
}

export default {
  sleep,
  tween,
  timer,
  sequential,
};
