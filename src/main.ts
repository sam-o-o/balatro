import './style.css'
import Phaser from 'phaser'
import { PreloadScene } from './scenes/preload-scene'
import { Titlescene } from './scenes/title-scene'
import { GameScene } from './scenes/gameboard-scene'
import { sizes } from './scenes/common'

const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement

const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    pixelArt: true,
    canvas: gameCanvas,
    scene: [PreloadScene, Titlescene, GameScene]
}

window.onload = () => {
    new Phaser.Game(gameConfig)
}