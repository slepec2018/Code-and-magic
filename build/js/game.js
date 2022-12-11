export default function startGame (
  fireballSize,
  getFireballSpeed,
  wizardWidth,
  wizardSpeed,
  getWizardHeight,
  getWizardX,
  getWizardY,
) {
  const GameConstants = {
    Fireball: {
      size: fireballSize || 24,
      speed: getFireballSpeed || function (movingLeft) {
        return movingLeft ? 2 : 5;
      },
    },
    Wizard: {
      speed: wizardSpeed || 2,
      width: wizardWidth || 61,
      getHeight: getWizardHeight || function (width) {
        return 1.377 * width;
      },
      getX: getWizardX || function (width) {
        return width / 3;
      },
      getY: getWizardY || function (height) {
        return height - 100;
      },
    },
  };

  /**
     * @const
     * @type {number}
     */
  const HEIGHT = 300;

  /**
     * @const
     * @type {number}
     */
  const WIDTH = 700;

  /**
     * ID levels.
     * @enum {number}
     */
  const Level = {
    INTRO: 0,
    MOVE_LEFT: 1,
    MOVE_RIGHT: 2,
    LEVITATE: 3,
    HIT_THE_MARK: 4,
  };

  const NAMES = ['Cake', 'Katia', 'Igor'];

  /**
     * Level order.
     * @type {Array.<Level>}
     */
  const LevelSequence = [
    Level.INTRO,
  ];

  /**
     * First level.
     * @type {Level}
     */
  const INITIAL_LEVEL = LevelSequence[0];

  /**
     * Permissible types of objects on the map.
     * @enum {number}
     */
  const ObjectType = {
    ME: 0,
    FIREBALL: 1,
  };

  /**
     * Valid Object States.
     * @enum {number}
     */
  const ObjectState = {
    OK: 0,
    DISPOSED: 1,
  };

  /**
     * Destination codes.
     * @enum {number}
     */
  const Direction = {
    NULL: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 4,
    DOWN: 8,
  };

  /**
     * Game sprite map.
     * @type {Object.<ObjectType, Object>}
     */
  const SpriteMap = {};
  const REVERSED = '-reversed';

  SpriteMap[ObjectType.ME] = {
    width: 61,
    height: 84,
    url: 'img/wizard.gif',
  };

  // TODO: Find a clever way
  SpriteMap[ObjectType.ME + REVERSED] = {
    width: 61,
    height: 84,
    url: 'img/wizard-reversed.gif',
  };

  SpriteMap[ObjectType.FIREBALL] = {
    width: 24,
    height: 24,
    url: 'img/fireball.gif',
  };

  /**
     * Rules for redrawing objects depending on the state of the game.
     * @type {Object.<ObjectType, function(Object, Object, number): Object>}
     */
  const ObjectsBehaviour = {};

  /**
     * Mage movement update. The movement of the magician depends on the currently pressed
     * shooter. The mage can move both horizontally and vertically at the same time.
     * The movement of the magician is affected by his intersection with obstacles.
     * @param {Object} object
     * @param {Object} state
     * @param {number} timeframe
     */
  ObjectsBehaviour[ObjectType.ME] = function (object, state, timeframe) {
    // While the up arrow is pressed, the magician first rises, and then levitates
    // in the air at a certain height.
    // NB! The difficulty lies in the fact that the behavior is described in coordinates
    // canvas, not coordinates, relative to the bottom of the game.
    if (state.keysPressed.UP && object.y > 0) {
      object.direction = object.direction & ~Direction.DOWN;
      object.direction = object.direction | Direction.UP;
      object.y -= object.speed * timeframe * 2;
    }

    // If the up arrow is not pressed, and the magician is in the air, he will smoothly
    // falls to the ground.
    if (!state.keysPressed.UP) {
      if (object.y < HEIGHT - object.height) {
        object.direction = object.direction & ~Direction.UP;
        object.direction = object.direction | Direction.DOWN;
        object.y += object.speed * timeframe / 3;
      }
    }

    // If the left arrow is pressed, the magician moves to the left.
    if (state.keysPressed.LEFT) {
      object.direction = object.direction & ~Direction.RIGHT;
      object.direction = object.direction | Direction.LEFT;
      object.x -= object.speed * timeframe;
    }

    // If the right arrow is pressed, the magician moves to the right.
    if (state.keysPressed.RIGHT) {
      object.direction = object.direction & ~Direction.LEFT;
      object.direction = object.direction | Direction.RIGHT;
      object.x += object.speed * timeframe;
    }

    // Restrictions on moving around the field. The mage cannot go out of the field.
    if (object.y < 0) {
      object.y = 0;
    }

    if (object.y > HEIGHT - object.height) {
      object.y = HEIGHT - object.height;
    }

    if (object.x < 0) {
      object.x = 0;
    }

    if (object.x > WIDTH - object.width) {
      object.x = WIDTH - object.width;
    }
  };

  /**
     * Fireball motion update. Fireball is released in a certain direction
     * and then uncontrollably moves in a straight line in a given direction. If a
     * it flies all the way through the screen, it disappears.
     * @param {Object} object
     * @param {Object} _state
     * @param {number} timeframe
     */
  ObjectsBehaviour[ObjectType.FIREBALL] = function (object, _state, timeframe) {
    if (object.direction & Direction.LEFT) {
      object.x -= object.speed * timeframe;
    }

    if (object.direction & Direction.RIGHT) {
      object.x += object.speed * timeframe;
    }

    if (object.x < 0 || object.x > WIDTH) {
      object.state = ObjectState.DISPOSED;
    }
  };

  /**
     * IDs of possible responses of functions that check the success of passing the level.
     * CONTINUE indicates that the round is not over and the game must continue,
     * WIN means that the round is won, FAIL means that the round is lost. PAUSE that game
     * need to be interrupted.
     * @enum {number}
     */
  const Verdict = {
    CONTINUE: 0,
    WIN: 1,
    FAIL: 2,
    PAUSE: 3,
    INTRO: 4,
  };

  /**
     * Level completion rules. Level IDs serve as keys, function values
     * taking the level state as input and returning true if the round
     * can be completed or false if not.
     * @type {Object.<Level, function(Object):boolean>}
     */
  const LevelsRules = {};

  /**
     * The level is considered passed if the fileball was released and it flew away
     * behind the screen.
     * @param {Object} state
     * @return {Verdict}
     */
  LevelsRules[Level.INTRO] = function (state) {
    const deletedFireballs = state.garbage.filter(function (object) {
      return object.type === ObjectType.FIREBALL;
    });

    const fenceHit = deletedFireballs.filter(function (fireball) {
      // Did we hit the fence?
      return fireball.x < 10 && fireball.y > 240;
    })[0];

    return fenceHit ? Verdict.WIN : Verdict.CONTINUE;
  };

  /**
     * Initial conditions for levels.
     * @enum {Object.<Level, function>}
     */
  const LevelsInitialize = {};

  /**
     * First level.
     * @param {Object} state
     * @return {Object}
     */
  LevelsInitialize[Level.INTRO] = function (state) {
    state.objects.push(
      // Setting the character to the starting position. He is on the far left
      // corner of the screen, looking to the right. Character movement speed on this
      // level is 2px per frame.
      {
        direction: Direction.RIGHT,
        height: GameConstants.Wizard.getHeight(GameConstants.Wizard.width),
        speed: GameConstants.Wizard.speed,
        sprite: SpriteMap[ObjectType.ME],
        state: ObjectState.OK,
        type: ObjectType.ME,
        width: GameConstants.Wizard.width,
        x: GameConstants.Wizard.getX(WIDTH),
        y: GameConstants.Wizard.getY(HEIGHT),
      },
    );

    return state;
  };

  /**
     * Game object constructor. Creates canvas, adds event handlers
     * and shows the welcome screen.
     * @param {Element} container
     * @constructor
     */
  const Game = function (container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._pauseListener = this._pauseListener.bind(this);

    this.setDeactivated(false);
  };

  Game.prototype = {
    /**
       * Current game level.
       * @type {Level}
       */
    level: INITIAL_LEVEL,

    /** @param {boolean} deactivated */
    setDeactivated: function (deactivated) {
      if (this._deactivated === deactivated) {
        return;
      }

      this._deactivated = deactivated;

      if (deactivated) {
        this._removeGameListeners();
      } else {
        this._initializeGameListeners();
      }
    },

    /**
       * Game state. Describes the location of all objects on the game map
       * and time spent on the level and in the game.
       * @return {Object}
       */
    getInitialState: function () {
      return {
        // Game status. If CONTINUE, then the game continues.
        currentStatus: Verdict.CONTINUE,

        // Objects removed in the last frame.
        garbage: [],

        // The time since the previous frame was drawn.
        lastUpdated: null,

        // The state of the keys pressed.
        keysPressed: {
          ESC: false,
          LEFT: false,
          RIGHT: false,
          SPACE: false,
          UP: false,
        },

        // Start time of the level.
        levelStartTime: null,

        // All objects on the map.
        objects: [],

        // Start time of the game.
        startTime: null,
      };
    },

    /**
       * Initial checks and launch of the current level.
       * @param {boolean=} restart
       */
    initializeLevelAndStart: function (restart) {
      restart = typeof restart === 'undefined' ? true : restart;

      if (restart || !this.state) {
        // When the level is restarted, the state is completely overwritten
        // games from the original state.
        this.state = this.getInitialState();
        this.state = LevelsInitialize[this.level](this.state);
      } else {
        // When you continue a level, the state is saved, except for a record of whether
        // that the state of the level has changed from paused to resumed.
        this.state.currentStatus = Verdict.CONTINUE;
      }

      // Record game start time and level start time.
      this.state.levelStartTime = Date.now();
      if (!this.state.startTime) {
        this.state.startTime = this.state.levelStartTime;
      }

      this._preloadImagesForLevel(function () {
        // Game screen preview.
        this.render();

        // Installing event handlers.
        this._initializeGameListeners();

        // Starting the game loop.
        this.update();
      }.bind(this));
    },

    /**
       * Temporary stop of the game.
       * @param {Verdict=} verdict
       */
    pauseLevel: function (verdict) {
      if (verdict) {
        this.state.currentStatus = verdict;
      }

      this.state.keysPressed.ESC = false;
      this.state.lastUpdated = null;

      this._removeGameListeners();
      window.addEventListener('keydown', this._pauseListener);

      this._drawPauseScreen();
    },

    /**
       * Keyboard event handler during pause.
       * @param {KeyboardsEvent} evt
       * @private
       * @private
       */
    _pauseListener: function (evt) {
      if (evt.keyCode === 32 && !this._deactivated) {
        evt.preventDefault();
        const needToRestartTheGame = this.state.currentStatus === Verdict.WIN ||
            this.state.currentStatus === Verdict.FAIL;
        this.initializeLevelAndStart(needToRestartTheGame);

        window.removeEventListener('keydown', this._pauseListener);
      }
    },

    /**
       * Pause screen rendering.
       */
    _drawPauseScreen: function () {
      let message;
      switch (this.state.currentStatus) {
        case Verdict.WIN:
          if (window.renderStatistics) {
            const statistics = this._generateStatistics(new Date() - this.state.startTime);
            const keys = this._schuffleArray(Object.keys(statistics));
            window.renderStatistics(this.ctx, keys, keys.map(function (it) {
              return statistics[it];
            }));
            return;
          }
          message = 'You have defeated Gazebo!\nHooray!';
          break;
        case Verdict.FAIL:
          message = 'You lost!';
          break;
        case Verdict.PAUSE:
          message = 'Pause game!\nPress Space to continue';
          break;
        case Verdict.INTRO:
          message = 'Welcome!\nPress Space to start the game';
          break;
      }

      this._drawMessage(message);
    },

    _generateStatistics: function (time) {
      const generationIntervalSec = 3000;
      const minTimeInSec = 1000;

      const statistic = {
        'Вы': time,
      };

      for (let i = 0; i < NAMES.length; i++) {
        const diffTime = Math.random() * generationIntervalSec;
        let userTime = time + (diffTime - generationIntervalSec / 2);
        if (userTime < minTimeInSec) {
          userTime = minTimeInSec;
        }
        statistic[NAMES[i]] = userTime;
      }

      return statistic;
    },

    _schuffleArray: function (array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    },

    _drawMessage: function (message) {
      const ctx = this.ctx;

      const drawCloud = function (x, y, width, heigth) {
        const offset = 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + offset, y + heigth / 2);
        ctx.lineTo(x, y + heigth);
        ctx.lineTo(x + width / 2, y + heigth - offset);
        ctx.lineTo(x + width, y + heigth);
        ctx.lineTo(x + width - offset, y + heigth / 2);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width / 2, y + offset);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
        ctx.fill();
      };

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      drawCloud(190, 40, 320, 100);

      ctx.fillStyle = 'rgba(256, 256, 256, 1.0)';
      drawCloud(180, 30, 320, 100);

      ctx.fillStyle = '#000';
      ctx.font = '16px PT Mono';
      message.split('\n').forEach(function (line, i) {
        ctx.fillText(line, 200, 80 + 20 * i);
      });
    },

    /**
       * Preload the necessary images for the level.
       * @param {function} callback
       * @private
       */
    _preloadImagesForLevel: function (callback) {
      if (typeof this._imagesArePreloaded === 'undefined') {
        this._imagesArePreloaded = [];
      }

      if (this._imagesArePreloaded[this.level]) {
        callback();
        return;
      }

      const keys = Object.keys(SpriteMap);
      let imagesToGo = keys.length;

      const self = this;

      const loadSprite = function (sprite) {
        const image = new Image(sprite.width, sprite.height);
        image.onload = function () {
          sprite.image = image;
          if (--imagesToGo === 0) {
            self._imagesArePreloaded[self.level] = true;
            callback();
          }
        };
        image.src = sprite.url;
      };

      for (let i = 0; i < keys.length; i++) {
        loadSprite(SpriteMap[keys[i]]);
      }
    },

    /**
       * Update the status of objects on the screen. Adds objects to be
       * appear, checks the behavior of all objects and removes those that
       * should disappear.
       * @param {number} delta The time elapsed since the last frame was drawn.
       */
    updateObjects: function (delta) {
      // Character.
      const me = this.state.objects.filter(function (object) {
        return object.type === ObjectType.ME;
      })[0];

      // Adds a fireball to the map by pressing Shift.
      if (this.state.keysPressed.SHIFT) {
        this.state.objects.push({
          direction: me.direction,
          height: GameConstants.Fireball.size,
          speed: GameConstants.Fireball.speed(me.direction & Direction.LEFT),
          sprite: SpriteMap[ObjectType.FIREBALL],
          type: ObjectType.FIREBALL,
          width: GameConstants.Fireball.size,
          x: me.direction & Direction.RIGHT ? me.x + me.width : me.x - GameConstants.Fireball.size,
          y: me.y + me.height / 2,
        });

        this.state.keysPressed.SHIFT = false;
      }

      this.state.garbage = [];

      // Removes objects that are not used on the map in garbage.
      const remainingObjects = this.state.objects.filter(function (object) {
        ObjectsBehaviour[object.type](object, this.state, delta);

        if (object.state === ObjectState.DISPOSED) {
          this.state.garbage.push(object);
          return false;
        }

        return true;
      }, this);

      this.state.objects = remainingObjects;
    },

    /**
       * Checking the status of the current level.
       */
    checkStatus: function () {
      // No need to run a check to see if the level should be stopped if
      // it is known in advance that yes.
      if (this.state.currentStatus !== Verdict.CONTINUE) {
        return;
      }

      if (!this.commonRules) {
        // Checks that do not depend on the level, but affect its state.
        this.commonRules = [

          /**
             * If the character is dead, the game ends.
             * @param {Object} state
             * @return {Verdict}
             */
          function (state) {
            const me = state.objects.filter(function (object) {
              return object.type === ObjectType.ME;
            })[0];

            return me.state === ObjectState.DISPOSED ?
              Verdict.FAIL :
              Verdict.CONTINUE;
          },

          /**
             * If the Esc key is pressed, the game is paused.
             * @param {Object} state
             * @return {Verdict}
             */
          function (state) {
            return state.keysPressed.ESC ? Verdict.PAUSE : Verdict.CONTINUE;
          },

          /**
             * The game ends if the player continues to play it for two consecutive hours.
             * @param {Object} state
             * @return {Verdict}
             */
          function (state) {
            return Date.now() - state.startTime > 3 * 60 * 1000 ?
              Verdict.FAIL :
              Verdict.CONTINUE;
          },
        ];
      }

      // Checking all the rules affecting the level. Starting a cycle of checks
      // for all generic and specific level tests.
      // The loop continues until either of the checks returns
      // any other state than CONTINUE or until all
      // checks. After that, the state is saved.
      const allChecks = this.commonRules.concat(LevelsRules[this.level]);
      let currentCheck = Verdict.CONTINUE;
      let currentRule;

      while (currentCheck === Verdict.CONTINUE && allChecks.length) {
        currentRule = allChecks.shift();
        currentCheck = currentRule(this.state);
      }

      this.state.currentStatus = currentCheck;
    },

    /**
       * Forced game state. Used to change
       * game states from external conditions, for example, when it is necessary to stop
       * game if it is out of view and set the intro
       * экран.
       * @param {Verdict} status
       */
    setGameStatus: function (status) {
      if (this.state.currentStatus !== status) {
        this.state.currentStatus = status;
      }
    },

    /**
       * Drawing all objects on the screen.
       */
    render: function () {
      // Removes all rendered elements on the page.
      this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Exposing all elements left in this.state.objects according to
      // their coordinates and direction.
      this.state.objects.forEach(function (object) {
        if (object.sprite) {
          const reversed = object.direction & Direction.LEFT;
          const sprite = SpriteMap[object.type + (reversed ? REVERSED : '')] || SpriteMap[object.type];
          this.ctx.drawImage(sprite.image, object.x, object.y, object.width, object.height);
        }
      }, this);
    },

    /**
       * Main game loop. First checks the state of all game objects
       * and updates them according to the rules of their behavior, and then runs
       * checking the current round. Recursively continues until
       * the check will not return a FAIL, WIN, or PAUSE status.
       */
    update: function () {
      if (!this.state.lastUpdated) {
        this.state.lastUpdated = Date.now();
      }

      const delta = (Date.now() - this.state.lastUpdated) / 10;
      this.updateObjects(delta);
      this.checkStatus();

      switch (this.state.currentStatus) {
        case Verdict.CONTINUE:
          this.state.lastUpdated = Date.now();
          this.render();
          requestAnimationFrame(function () {
            this.update();
          }.bind(this));
          break;

        case Verdict.WIN:
        case Verdict.FAIL:
        case Verdict.PAUSE:
        case Verdict.INTRO:
          this.pauseLevel();
          break;
      }
    },

    /**
       * @param {KeyboardEvent} evt [description]
       * @private
       */
    _onKeyDown: function (evt) {
      switch (evt.keyCode) {
        case 37:
          this.state.keysPressed.LEFT = true;
          break;
        case 39:
          this.state.keysPressed.RIGHT = true;
          break;
        case 38:
          this.state.keysPressed.UP = true;
          break;
        case 27:
          this.state.keysPressed.ESC = true;
          break;
      }

      if (evt.shiftKey) {
        this.state.keysPressed.SHIFT = true;
      }
    },

    /**
       * @param {KeyboardEvent} evt [description]
       * @private
       */
    _onKeyUp: function (evt) {
      switch (evt.keyCode) {
        case 37:
          this.state.keysPressed.LEFT = false;
          break;
        case 39:
          this.state.keysPressed.RIGHT = false;
          break;
        case 38:
          this.state.keysPressed.UP = false;
          break;
        case 27:
          this.state.keysPressed.ESC = false;
          break;
      }

      if (evt.shiftKey) {
        this.state.keysPressed.SHIFT = false;
      }
    },

    /** @private */
    _initializeGameListeners: function () {
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    },

    /** @private */
    _removeGameListeners: function () {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    },
  };

  Game.Verdict = Verdict;

  const game = new Game(document.querySelector('.demo'));
  game.initializeLevelAndStart();
  game.setGameStatus(Verdict.INTRO);

  return game;
}
