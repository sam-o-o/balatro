import Phaser from 'phaser'
import { scene_keys, deck, create_card, get_card_image_name, Suit } from './common'

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: scene_keys.preload })
    }

    public preload(): void {
        this.load.image("bg", "/assets/bg.jpg") // Game backgound image
        this.load.image("title_bg", "/assets/title_bg.webp") // Title background image
        this.load.image("title_text", "/assets/title_text.png") // Title text image
        this.load.image("click_to_start", "/assets/clickToStart.png") // Title click to start image
        this.load.image("play_hand_button", "/assets/play_hand_button.png") // Play hand button image
        this.load.image("discard_button", "/assets/discard_button.png") // Discard button image

        for (let value = 2; value <= 14; value++){ 
            // All playing card images
            this.load.image(get_card_image_name(Suit.hearts, value), `/assets/playing_cards/Hearts_${value}.png`)
            this.load.image(get_card_image_name(Suit.spades, value), `/assets/playing_cards/Spades_${value}.png`)
            this.load.image(get_card_image_name(Suit.diamonds, value), `/assets/playing_cards/Diamonds_${value}.png`)
            this.load.image(get_card_image_name(Suit.clubs, value), `/assets/playing_cards/Clubs_${value}.png`)

            if(value <= 10) {
                for(let suit = 0; suit < 4; suit++){
                    deck.push(create_card(get_card_image_name(suit, value), value, suit, value, 1, 0, 1))
                }
            }
            else if(value < 14) {
                for(let suit = 0; suit < 4; suit++){
                    deck.push(create_card(get_card_image_name(suit, value), value, suit, 10, 1, 0, 1))
                }
            }
            else {
                for(let suit = 0; suit < 4; suit++){
                    deck.push(create_card(get_card_image_name(suit, value), value, suit, 11, 1, 0, 1))
                }
            } 
        }
    }

    public create(): void {
        this.scene.start(scene_keys.gameboard)
        //this.scene.start(scene_keys.title)
    }
}