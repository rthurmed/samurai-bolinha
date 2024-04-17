import kaboom, { AreaComp, GameObj, PosComp, Rect, SpriteComp, Vec2 } from "kaboom";

const DEBUG = false;
const GAME_GRAVITY = 400;
const GAME_WIDTH = 176;
const GAME_HEIGHT = 240;
const GAME_SCALE = window.innerWidth < window.innerHeight
  ? window.innerWidth / GAME_WIDTH
  : window.innerHeight / GAME_HEIGHT;
const BALL_WIDTH = 32;
const BALL_HEIGHT = 32;
const BALL_COLLISION_PADDING = 4;
const SPAWN_SIZE = 100;
const ATTACK_LENGTH = 16;
const ATTACK_LENGTH_MOUSE = 4;
const ATTACK_MARKER_SIZE = 12;

const k = kaboom({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  touchToMouse: false,
  scale: GAME_SCALE,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  debug: DEBUG,
});

k.debug.inspect = DEBUG;
k.setBackground(k.Color.fromHex("#17111a"));

k.loadSprite("bean", "./sprites/bean.png");
k.loadSprite("ball", "./sprites/ball.png");
k.loadSprite("samurai", "./sprites/samurai.png");

k.scene("swipe-particles", () => {
  k.setGravity(GAME_GRAVITY);

  const game = k.add([
    k.timer()
  ]);

  if (!k.debug.inspect) {
    const background = game.add([
      k.rect(k.width(), k.height()),
      k.pos(),
      k.color(k.Color.fromHex("#ffbf36")),
      k.z(-10),
    ]);
  }

  const avatar = game.add([
    k.sprite("samurai"),
    k.anchor("botleft"),
    k.pos(0, k.height() + 8)
  ]);

  let lastPos = k.vec2();
  let direction = k.vec2();

  const handleMove = (pos: Vec2, attackSize: number) => {
    const scaledPos = pos.scale(1/GAME_SCALE);
    direction = k.Vec2.fromAngle(scaledPos.angle(lastPos));
    lastPos = scaledPos;

    // physics
    const line = new k.Line(lastPos, lastPos.add(direction.scale(attackSize)));
    const balls = game.get("ball");
    
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i] as GameObj<SpriteComp | AreaComp | PosComp>;
      const shapeRect = ball.area.shape as Rect;
      const rect = new k.Rect(
        ball.pos.add(k.vec2(-shapeRect.width/2, -shapeRect.height/2)), // centralized
        shapeRect.width,
        shapeRect.height
      );
      
      if (k.debug.inspect) {
        k.drawRect({ ...rect });
      }

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
  }

  game.onTouchMove((pos, touch) => {
    handleMove(pos, ATTACK_LENGTH);
  });

  game.onMouseMove((pos, delta) => {
    if (k.isMouseDown("left")) {
      handleMove(pos, ATTACK_LENGTH_MOUSE);
    }
  });

  game.onDraw(() => {
    if (k.debug.inspect) {
      k.drawLine({
        p1: lastPos,
        p2: lastPos.add(direction.scale(ATTACK_LENGTH)),
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
