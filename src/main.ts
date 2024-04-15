import kaboom, { AreaComp, GameObj, PosComp } from "kaboom";

const BEAN_WIDTH = 61;
const BEAN_HEIGHT = 53;
const ATTACK_RAY_LENGTH = 16;

const k = kaboom({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 1000,
  debug: true
});

k.debug.inspect = true;

k.loadSprite("bean", "./sprites/bean.png");

k.scene("swipe-particles", () => {
  k.setGravity(2400);

  const game = k.add([
    k.timer()
  ]);

  let lastPos = k.vec2();
  let direction = k.vec2();

  game.onTouchMove((pos, touch) => {
    direction = k.Vec2.fromAngle(pos.angle(lastPos));
    lastPos = pos;

    // physics
    const line = new k.Line(lastPos, lastPos.add(direction.scale(ATTACK_RAY_LENGTH)));
    const balls = game.get("ball");
    
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i] as GameObj<AreaComp | PosComp>;
      const rect = ball.area.shape.bbox();
      rect.pos = ball.pos;
      const collides = k.testRectLine(rect, line);
      if (collides) {
        ball.destroy();
        k.addKaboom(lastPos);
      }
    }

    // vfx
    const marker = game.add([
      k.circle(32),
      k.pos(pos),
      k.scale(),
      k.lifespan(.5),
      k.anchor("center")
    ]);
    marker.onUpdate(() => {
      marker.scale = marker.scale.scale(1 - k.dt() * 4);
    });
  });

  const entity = game.add([
    "ball",
    k.anchor("center"),
    k.area({
      shape: new k.Rect(k.vec2(), BEAN_WIDTH, BEAN_HEIGHT)
    }),
    k.body({
      isStatic: true
    }),
    k.pos(k.center()),
    k.offscreen({ destroy: true }),
    // k.sprite("bean"),
  ]);

  game.onDraw(() => {
    if (k.debug.inspect) {
      k.drawLine({
        p1: lastPos,
        p2: lastPos.add(direction.scale(ATTACK_RAY_LENGTH)),
        color: k.RED,
        width: 4,
      });
    }

    // TODO: draw only after ball is destroyed
    // TODO: draw each side separately after the cut
    const cutPercent = .35;
    const cutHeight = BEAN_HEIGHT * cutPercent;

    k.drawSubtracted(() => {
      k.drawSprite({
        sprite: "bean",
        color: k.RED,
        pos: k.center().add(k.vec2(-BEAN_WIDTH/2, -BEAN_HEIGHT/2)),
      });
    }, () => {
      k.drawRect({
        width: BEAN_WIDTH,
        height: cutHeight,
        pos: k.center().add(k.vec2(-BEAN_WIDTH/2, -BEAN_HEIGHT/2)),
      });
    });

    k.drawSubtracted(() => {
      k.drawSprite({
        sprite: "bean",
        color: k.GREEN,
        pos: k.center().add(k.vec2(-BEAN_WIDTH/2, -BEAN_HEIGHT/2)),
      });
    }, () => {
      k.drawRect({
        width: BEAN_WIDTH,
        height: BEAN_HEIGHT - cutHeight,
        pos: k.center().add(k.vec2(-BEAN_WIDTH/2, -BEAN_HEIGHT/2 + cutHeight)),
      });
    });
  });

  // game.loop(1, () => {
  //   // 
  //   const offset = k.vec2(k.randi(-100, 100), k.randi(-100, 100));
  //   entity.pos = entity.pos.add(offset);
  //   entity.jump();
  // });
});

k.go("swipe-particles");
