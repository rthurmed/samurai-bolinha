import kaboom, { AreaComp, GameObj, PosComp, Rect, SpriteComp } from "kaboom";

const GAME_SCALE = 5;
const GAME_GRAVITY = 400;
const BALL_WIDTH = 32;
const BALL_HEIGHT = 32;
const BALL_COLLISION_PADDING = 4;
const SPAWN_SIZE = 100;
const ATTACK_RAY_LENGTH = 32;
const ATTACK_MARKER_SIZE = 16;

const k = kaboom({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  scale: GAME_SCALE,
  debug: false
});

k.debug.inspect = false;

k.loadSprite("bean", "./sprites/bean.png");
k.loadSprite("ball", "./sprites/ball.png");
k.loadSprite("samurai", "./sprites/samurai.png");

k.scene("swipe-particles", () => {
  k.setGravity(GAME_GRAVITY);
  k.setBackground(k.Color.fromHex("#ffbf36"));

  const game = k.add([
    k.timer()
  ]);

  const avatar = game.add([
    k.sprite("samurai"),
    k.anchor("botleft"),
    k.pos(0, k.height() + 8)
  ])

  let lastPos = k.vec2();
  let direction = k.vec2();

  game.onTouchMove((pos, touch) => {
    const scaledPos = pos.scale(1/GAME_SCALE);
    direction = k.Vec2.fromAngle(scaledPos.angle(lastPos));
    lastPos = scaledPos;

    // physics
    const line = new k.Line(lastPos, lastPos.add(direction.scale(ATTACK_RAY_LENGTH)));
    const balls = game.get("ball");
    
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i] as GameObj<SpriteComp | AreaComp | PosComp>;
      const rect = new k.Rect(ball.pos, ball.width, ball.height)
      const collides = k.testRectLine(rect, line);
      if (collides) {
        ball.destroy();
        k.addKaboom(lastPos, {
          scale: 1/(GAME_SCALE - 2)
        });
      }
    }

    // vfx
    const marker = game.add([
      k.circle(ATTACK_MARKER_SIZE),
      k.pos(scaledPos),
      k.scale(),
      k.lifespan(.5),
      k.anchor("center")
    ]);
    marker.onUpdate(() => {
      marker.scale = marker.scale.scale(1 - k.dt() * 4);
    });
  });

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
    // const cutPercent = .35;
    // const cutHeight = BALL_HEIGHT * cutPercent;

    // k.drawSubtracted(() => {
    //   k.drawSprite({
    //     sprite: "ball",
    //     color: k.RED,
    //     pos: k.center().add(k.vec2(-BALL_WIDTH/2, -BALL_HEIGHT/2)),
    //   });
    // }, () => {
    //   k.drawRect({
    //     width: BALL_WIDTH,
    //     height: cutHeight,
    //     pos: k.center().add(k.vec2(-BALL_WIDTH/2, -BALL_HEIGHT/2)),
    //   });
    // });

    // k.drawSubtracted(() => {
    //   k.drawSprite({
    //     sprite: "ball",
    //     color: k.GREEN,
    //     pos: k.center().add(k.vec2(-BALL_WIDTH/2, -BALL_HEIGHT/2)),
    //   });
    // }, () => {
    //   k.drawRect({
    //     width: BALL_WIDTH,
    //     height: BALL_HEIGHT - cutHeight,
    //     pos: k.center().add(k.vec2(-BALL_WIDTH/2, -BALL_HEIGHT/2 + cutHeight)),
    //   });
    // });
  });

  const createBall = ({
    isStatic = false
  } = {}) => {
    return game.add([
      "ball",
      k.anchor("center"),
      k.area({
        shape: new k.Rect(
          k.vec2(),
          BALL_WIDTH + (BALL_COLLISION_PADDING * 2),
          BALL_HEIGHT + (BALL_COLLISION_PADDING * 2)
        ),
        collisionIgnore: ["ball"]
      }),
      k.body({
        isStatic,
        jumpForce: 200
      }),
      k.color(k.choose([
        k.Color.fromHex("#83e04c"),
        k.Color.fromHex("#3898ff"),
        k.Color.fromHex("#bf3fb3"),
        k.Color.fromHex("#682b82"),
        k.Color.fromHex("#e14141"),
        k.Color.fromHex("#ff80aa"),
      ])),
      k.pos(k.center()),
      k.offscreen({ destroy: true }),
      k.sprite("ball"),
    ]);
  }

  // const ball = createBall({ isStatic: true });

  game.loop(.75, () => {
    const ball = createBall();
    ball.pos = k.vec2(
      k.randi(BALL_WIDTH, k.width() - BALL_WIDTH),
      k.height() / 2 + k.randi(-SPAWN_SIZE, SPAWN_SIZE)
    );
    ball.jump();
  });
});

k.go("swipe-particles");
