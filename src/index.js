import './style.css';
import Phaser from 'phaser';
import playerRunningSprite from './assets/player_run.png';
import enemySprite from './assets/mort.png';
import ground from './assets/black-platform.png';
import bgTrees from './assets/day/png/trees.png';
import bgSky from './assets/day/png/sky.png';
import bgClouds from './assets/day/png/clouds.png';
import platform from './assets/day/png/platform.png';
import playBtn from './assets/play-button.png';
import scoreSound from './assets/score.wav';
import loseSound from './assets/creature-cry.wav';


class TitleScreen extends Phaser.Scene
{
    constructor ()
    {
        super({
            key: "TitleScreen"
        });
    }

    preload ()
    {
        this.load.image('playBtn', playBtn);
        this.load.image('ground', ground);
        this.load.image('bgSky', bgSky);
        this.load.image('bgClouds', bgClouds);
        this.load.image('bgTrees', bgTrees);
        this.load.image('bgGround', platform);
    }

    create ()
    {
        this.setHighScore();
        this.showBackground();
        this.showTitle();
        this.showHighScore();
        this.showPlayBtn();
        this.listenForPlay();
    }

    setHighScore()
    {
        if (!window.localStorage.getItem('dinoJumperHighScore')) {
            window.localStorage.setItem('dinoJumperHighScore', 0);
        }
    }

    showBackground ()
    {
        this.bgSky = this.add.tileSprite(200, 70 , 400, 80, 'bgSky');
        this.bgClouds  = this.add.tileSprite(200, 71, 400, 142, 'bgClouds');
        this.bgTrees  = this.add.tileSprite(200, 140, 400, 130, 'bgTrees');
        this.bgGround  = this.add.tileSprite(200, 206, 400, 30, 'bgGround');
    }

    showTitle ()
    {
        const titleStyle = { fontSize: "32px", fill: "#fff", stroke: "#000", strokeThickness: 5, fontFamily: "monospace" };
        this.add.text(95, 25, 'DINO JUMPER', titleStyle);
    }

    showHighScore ()
    {
        const scoreCount = window.localStorage.getItem('dinoJumperHighScore');
        const scoreStyle = { fontSize: "16px", fill: "#fff", fontFamily: "monospace" };
        this.add.text(139, 155, `High Score: ${scoreCount}`, scoreStyle);
    }

    showPlayBtn()
    {
        // Play button
        this.playBtn = this.add.image(200, 110, 'playBtn');
        this.playBtn.setInteractive();
    }

    listenForPlay()
    {
        this.input.on('gameobjectdown',() => {
            this.scene.start("RunnerGame");
        });
    }

}

class RunnerGame extends Phaser.Scene
{
    constructor ()
    {
        super({
            key: "RunnerGame"
        });
    }

    preload ()
    {
        this.load.image('playBtn', playBtn);
        this.load.image('ground', ground);
        this.load.image('bgSky', bgSky);
        this.load.image('bgClouds', bgClouds);
        this.load.image('bgTrees', bgTrees);
        this.load.image('bgGround', platform);

        this.load.spritesheet('runner', playerRunningSprite, 
        {
            frameWidth: 30,
            frameHeight: 40
        });

        this.load.spritesheet('enemy', enemySprite, 
        {
            frameWidth: 24,
            frameHeight: 17
        });

        this.scoreSoundLoader = this.load.audio('score', [scoreSound]);
        this.loseSoundLoader = this.load.audio('lose', [loseSound]);
    }

    create ()
    {
        this.inAir = false; // "In Air" status to prevent double jumping
        this.pointAvailable = true; // Whether or not a point is available. 
        this.score = 0; // Keep track of score, start at 0

        this.addMusic();
        this.addPlatform();
        this.addBackground();
        this.addScoreCount();
        this.addRunner();
        this.addEnemy();

        // Listen for input pointer click
        this.input.on('pointerdown', this.startJump, this);

        //Spawn an enemy timer
        this.timer = this.time.addEvent({
            delay: 3000,
            callback: () => this.addEnemy(),
            callbackScope: this,
            loop: true
        });
    }

    update()
    {
        this.bgClouds.tilePositionX += .1;
        this.bgTrees.tilePositionX += .3;
        this.bgGround.tilePositionX += .5;

        this.checkForScore();
        this.runnerInAirStatus();
    }

    runnerInAirStatus()
    {
        if (this.runner.y < 172) {
            this.inAir = true;
        } else {
            this.inAir = false;
        }
    }

    addMusic()
    {
        this.scoreSound = this.sound.add('score');
        this.loseSound = this.sound.add('lose');
    }

    addPlatform()
    {
        this.platform = this.physics.add.staticImage(200, 204, 'ground').setImmovable();
    }

    addRunner()
    {
        // Running player sprite
        this.running = this.anims.create({
            key: 'running',
            frames: this.anims.generateFrameNumbers('runner', { frames: [ 0, 1, 2, 3, 4, 5, 6, 7 ] }),
            frameRate: 8,
            repeat: -1
        });
        this.runner = this.physics.add.sprite(44,150);
        this.runner.body.collideWorldBounds = true;
        this.runner.setScale(1);
        this.runner.play('running');
        this.runner.body.setSize(20,34);

        // Add collider between runner and platform
        this.physics.add.collider(this.runner, this.platform);
    }

    addEnemy()
    {
        this.enemyRunning = this.anims.create({
            key: 'enemy-running',
            frames: this.anims.generateFrameNumbers('enemy', { frames: [ 17, 16, 15, 14 ] }),
            frameRate: 8,
            repeat: -1
        });

        this.enemy = this.physics.add.sprite(401,183);
        this.enemy.body.collideWorldBounds = false;
        this.enemy.setScale(1);
        this.enemy.play('enemy-running');
        this.enemy.body.setSize(17,17, true);
        this.enemy.setVelocityX(-160);

        // Enemy and platform collision
        this.physics.add.collider(this.enemy, this.platform);
        this.physics.add.collider(this.enemy, this.runner);
        this.physics.add.overlap(this.enemy, this.runner, this.playerEnemyTouch, null, this);

        // Allow a point to be available for each enemy that spawns
        // Otherwise you would score more than one point per enemy
        this.pointAvailable = true;
    }

    addScoreCount()
    {
        // Display score count to player
        const scoreStyle = { fontSize: "20px", fill: "#fff", stroke: "#000", strokeThickness: 4, fontFamily: "monospace" };
        this.scoreTextVisible = this.add.text(200, 20, this.score, scoreStyle);
    }

    addBackground()
    {
        this.bgSky = this.add.tileSprite(200, 70 , 400, 80, 'bgSky').setScrollFactor(.25);
        this.bgClouds  = this.add.tileSprite(200, 71, 400, 142, 'bgClouds').setScrollFactor(.25);
        this.bgTrees  = this.add.tileSprite(200, 140, 400, 130, 'bgTrees').setScrollFactor(.25);
        this.bgGround  = this.add.tileSprite(200, 206, 400, 30, 'bgGround').setScrollFactor(.25);

        this.bgSky.fixedToCamera = true;
        this.bgClouds.fixedToCamera = true;
        this.bgTrees.fixedToCamera = true;
        this.bgGround.fixedToCamera = true;
    }

    checkForScore()
    {
        if (!this.pointAvailable)
        {
            return;
        }

        if (this.enemy.x < 30)
        {
            this.scoreSound.play();
            this.score += 1;
            this.updateLocalStorage();
            this.pointAvailable = false;
            this.scoreTextVisible.setText(this.score);
        }
    }

    updateLocalStorage()
    {
        const currentScore = this.score;
        const pastHighScore = window.localStorage.getItem('dinoJumperHighScore');
        if (currentScore > pastHighScore) {
            window.localStorage.setItem('dinoJumperHighScore', currentScore);
        }
    }

    playerEnemyTouch() {
        // this.music.stop();
        this.loseSound.play();
        this.scene.stop("RunnerGame");
        this.scene.start("TitleScreen");
    }


    startJump() 
    {
        if (!this.inAir) {
            this.runner.setVelocityY(-100);
        }
    }


}


const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 220,
    backgroundColor: '#70e3ce',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: true,
        }
    },
    scene: [TitleScreen, RunnerGame]
};

const game = new Phaser.Game(config);
