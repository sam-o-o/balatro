import Phaser from 'phaser'
import { empty, push, top, pop, Stack, is_empty } from './stack'
import { sizes, deck, Card, Suit, CardSlot } from '../scenes/common'
    
let card_slots: Array<CardSlot> = []
let played_card_slots: Array<CardSlot> = []

let deck_stack: Stack<Card>

const num_slots: number = 7 // Number of slots
const panel_width: number = 330
const slotSpacing: number = 120  // Space between slots
const left_side_offset: number = 25
const startX: number = left_side_offset * 2 + panel_width + sizes.card_width / 2 // Center slots
const slotY: number = sizes.height - 200  // Position near bottom
let blind_specific_color: number = 0x1445cc
let discard_counter: number = 4, play_counter: number = 4
let result_of_hand: Array<number> = [], poker_hand: string
let hand_counter: Phaser.GameObjects.Text, discard: Phaser.GameObjects.Text
let chips: Phaser.GameObjects.Text, mult: Phaser.GameObjects.Text
let type_of_hand: Phaser.GameObjects.Text


function num_selected_slots_getter (){
    return card_slots.filter(slot => slot.selected).length
}

/** 
* Takes the name associated with a preloaded audio file + scene, and plays the sound file
* Sound file MUST be preloaded before calling function
* @param {string} audio_name
* @param {Phaser.Scene} scene
*/
export function play_sound(audio_name: string, scene: Phaser.Scene) {
    const sound = scene.sound.add(audio_name)
             sound.play()
}

/**
 * Takes a deck and shuffles it to a stack
 * @param {Array} arr - An array of cards that represents the full deck 
 * @returns {Stack} - Returns a stack in which the deck is shuffled
 */
export function shuffle_cards(arr: Array<Card>): Stack<Card> {
    // Create a copy of the array to preserve the original
    let shuffledArray = [...arr]; 
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Pick a random index from 0 to i
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }

    // Convert the shuffled array to a stack and return it
    let stack: Stack<Card> = empty<Card>();
    shuffledArray.forEach(card => {
        stack = push(card, stack);
    });

    return stack;
}

/**
 * Calculates a hands value based on the poker hands
 * base value and the cards value
 * @param {Array} arr - An array of cards that represents the played hand
 * @returns {Array} - An array of the chip total and mult total
 */
export function calculate_hand(arr: Array<Card>): Array<number> {
    let chip_five_cards: number = arr.reduce((sum, card) => {return sum + card.chip_flat}, 0)
    let mult_five_cards: number = arr.reduce((sum, card) => {return sum + card.mult_flat}, 0)

    const values: Array<number> = arr.map(arr => arr.value).sort((a, b) => a - b);
    const suits: Array<Suit> = arr.map(arr => arr.suit);

    const valueCounts: Record<number, number> = values.reduce((acc, v) => ((acc[v] = (acc[v] || 0) + 1), acc), {} as Record<number, number>);
    const counts: Array<number> = Object.values(valueCounts).sort((a, b) => b - a);

    poker_hand = get_poker_hand(arr); 

    switch (poker_hand) {
        case "royal flush": 
        case "straight flush": {
            return [100 + chip_five_cards, 8 + mult_five_cards]
        }
        
        case "four of a kind": {
            let value = Object.keys(valueCounts).map(Number).filter(v => valueCounts[v] === 4)[0]
            let chip_mult: Array<number> = get_chip_mult_tot(value, arr);
            return [60 + chip_mult[0], 7 + chip_mult[1]]
        }

        case "full house":
            return [40 + chip_five_cards, 4 + mult_five_cards]

        case "flush":
            return [35 + chip_five_cards, 4 + mult_five_cards]

        case "straight":
            return [30 + chip_five_cards, 4 + mult_five_cards]
            
        case "three of a kind": {
            let value = Object.keys(valueCounts).map(Number).filter(v => valueCounts[v] === 3)[0]
            let chip_mult = get_chip_mult_tot(value, arr);
            return [30 + chip_mult[0], 3 + chip_mult[1]]
        }

        case "two pair": {
            let pairValues = Object.keys(valueCounts).map(Number).filter(v => valueCounts[v] === 2)
            let chip_mult_1 = get_chip_mult_tot(pairValues[0], arr);
            let chip_mult_2 = get_chip_mult_tot(pairValues[1], arr);

            return [20 + chip_mult_1[0] + chip_mult_2[0], 2 + chip_mult_1[1] + chip_mult_2[1]];
        }
            
        case "pair": {
            let value = Object.keys(valueCounts).map(Number).filter(v => valueCounts[v] === 2)[0]
            let chip_mult = get_chip_mult_tot(value, arr);
            return [10 + chip_mult[0], 2 + chip_mult[1]]
        }
            
        default:
            return [arr[0].chip_flat + 5, arr[0].mult_flat + 1]
    }

    // Calculates the chip total and mult total for certain cards
    function get_chip_mult_tot(value: number, arr: Array<Card>): Array<number> {
        let chip_tot: number = 0, mult_tot: number = 0
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].value === value) {
                chip_tot += arr[i].chip_flat 
                mult_tot += arr[i].mult_flat
            }
        }
        return [chip_tot, mult_tot]
    }

    //Returns the correct poker hand
    function get_poker_hand(cards: Array<Card>): string {
        if (cards.length === 1) {
            return "high card"
        } 
        
        const is_flush: boolean = cards.length === 5 && new Set(suits).size === 1;
        const is_straight: boolean = cards.length === 5 && (values.every((v, i) => i === 0 || v === values[i - 1] + 1));
        
        if (is_straight && is_flush) {
            return values[0] === 10 ? "royal flush" : "straight flush"
        } else if (counts[0] === 4) {
            return "four of a kind"
        } else if (counts[0] === 3 && counts[1] === 2) {
            return "full house"
        } else if (is_flush) {
            return "flush"
        } else if (is_straight) {
            return "straight"
        } else if (counts[0] === 3) {
            return "three of a kind"
        } else if (counts[0] === 2 && counts[1] === 2) {
            return "two pair"
        } else if (counts[0] === 2) {
            return "pair"
        } 

        return "high card"
    }
}

/**
 * Makes seven card slots and puts cards in them
 * @param {Phaser.scene} scene - The scene the function is used in 
 */
export function create_played_hand_slots(scene: Phaser.Scene): void {
    for (let i = 0; i < 5; i++) {
        const x = startX + i * 130 + 100
        const y = sizes.height / 2
        let played_slot: CardSlot = {
            card: null,
            selected: false,
            disabled: false,
            x: x,
            y: y
        }

        const slot = scene.add.rectangle(played_slot.x, played_slot.y, sizes.card_width, sizes.card_height, 0xffffff, 0.3)
        slot.setStrokeStyle(2, 0x000000)  // Outline
        played_card_slots.push(played_slot)  // Adding the position
    }
}


export function create_card_slots(scene: Phaser.Scene): void {

    // Clear existing card slots and cards
    deck_stack  = shuffle_cards(deck)

    for (let i = 0; i < num_slots; i++) {
        const x = startX + i * slotSpacing
        const y = slotY
        let card_slot: CardSlot = {
            card: null,
            selected: false,
            disabled: false,
            x: x,
            y: y
        }

        // Optional: Add a visual representation of the slots
        const slot = scene.add.rectangle(card_slot.x, card_slot.y, sizes.card_width, sizes.card_height, 0xffffff, 0.3)
        slot.setStrokeStyle(2, 0x000000)  // Outline
        card_slots.push(card_slot)  // Adding the position
    }

    draw_cards(scene)
}

/**
 * Creates the two buttons "Play hand" and "Discard"
 * @param {Phaser.scene} scene - The scene the function is used in  
 */
export function create_hand_buttons(scene: Phaser.Scene): void {
    let hand_button_image: Phaser.GameObjects.Image
    let discard_button_image: Phaser.GameObjects.Image

    const x = startX + 3 * slotSpacing
    const y = slotY + 140
    const space_between_buttons: number = 80

    // Play hand button
    hand_button_image = scene.add.image(x - space_between_buttons, y , "play_hand_button")
    hand_button_image.setScale(0.5)
    hand_button_image.setInteractive()
    hand_button_image.on("pointerdown", function() {
        if (num_selected_slots_getter() > 0) {
            if (play_counter > 0) {
                play_counter--
                play_cards(scene)
                draw_cards(scene)
                update_left_panel(scene)
            }
        }
    })

    // Discard button
    discard_button_image = scene.add.image(x + space_between_buttons, y, "discard_button")
    discard_button_image.setScale(0.5)
    discard_button_image.setInteractive()
    discard_button_image.on("pointerdown", function() {
        if (num_selected_slots_getter() > 0) {
            if(discard_counter > 0) {
                discard_counter--
                update_left_panel(scene)
                discard_cards(scene)
                draw_cards(scene)
            }
        }
    })
}

/**
 * For every empty card slots draws equal ammount
 * of cards and puts the in your hand
 * @param {Phaser.scene} scene - The scene the function is used in   
 */
function draw_cards(scene: Phaser.Scene): void {
    for(let i = 0; i < num_slots; i++) {
        if(card_slots[i].card == null) {
            if(is_empty(deck_stack))
                return
            const card_slot: CardSlot = card_slots[i]
            const card: Card = top(deck_stack)
            deck_stack = pop(deck_stack)
            const card_display = scene.add.image(card_slot.x, card_slot.y, card.image)
            card_slot.card = card
            card_display.setDisplaySize(sizes.card_width, sizes.card_height)
            card_display.setInteractive()
            card_display.on('pointerdown', function() {
                let numSelectedSlots : number = num_selected_slots_getter()

                if(!card_slot.selected) {
                    if(numSelectedSlots < 5){
                        card_display.setPosition(card_slot.x, card_slot.y - 30)
                        card_slot.selected = true
                        play_sound("select_card", scene)
                    }
                }
                else {
                    card_display.setPosition(card_slot.x, card_slot.y)
                    card_slot.selected = false
                    play_sound("deselect_card", scene)
                }
            })
        }
    }
}

function play_cards(scene: Phaser.Scene): void {
    let arr: Array<Card> = []
    for(let i = 0; i < num_slots; i++) {
        if(card_slots[i].selected) {
            arr.push(card_slots[i].card as Card)
            destroy_images_by_key(card_slots[i].card, scene)
            card_slots[i].card = null
            card_slots[i].selected = false
            card_slots[i].disabled = false
        }
    }
    result_of_hand = calculate_hand(arr)
    update_left_panel(scene)
}

function discard_cards(scene: Phaser.Scene): void {
    for(let i = 0; i < num_slots; i++) {
        if(card_slots[i].selected) {
                    //removes the card
            destroy_images_by_key(card_slots[i].card, scene)
                    //resets the slot
            card_slots[i].card = null
            card_slots[i].selected = false
            card_slots[i].disabled = false
        }
    }
    play_sound("discard", scene)
}

function destroy_images_by_key(card: Card | null, scene: Phaser.Scene) {
    let key: string
    if(card !== null) {
        key = card.image
    }

    scene.children.list.forEach((child) => {
        if (child instanceof Phaser.GameObjects.Image && child.texture.key === key) {
            child.destroy()
        }
    })
}

export function create_left_panel(scene: Phaser.Scene): void {
    const panel = scene.add.rectangle(left_side_offset, 0, panel_width, sizes.height, 0x25272e, 0.9).setOrigin(0, 0)

    const left_panel = scene.add.image(left_side_offset, 0, "left_panel").setOrigin(0, 0)
    left_panel.setDisplaySize(panel_width, sizes.height)
    // Draw background
    panel.setStrokeStyle(10, blind_specific_color)  // Outline

    const button = scene.add.image(52, 593.5, "info_button").setOrigin(0, 0)
    button.setScale(0.97)
    button.setInteractive()
    button.on("pointerdown", () => {
        const info = scene.add.image(700, 450, "info_card")
        const cross = scene.add.image(1130, 20, "cross").setOrigin(0, 0)
        cross.setScale(0.5)
        cross.setInteractive()
        cross.on("pointerdown", () => {
            info.destroy()
            cross.destroy()
        })
    })
    hand_counter = scene.add.text(100, 510, play_counter.toString(), {
        fontSize: "50px"
    })

    discard = scene.add.text(250, 510, discard_counter.toString(), {
        fontSize: "50px"
    })

    chips = scene.add.text(80, 362, "", {
        fontSize: "50px"
    })

    mult = scene.add.text(220, 362, "", {
        fontSize: "50px"
    })

    type_of_hand = scene.add.text(90, 300, "", {
        fontSize: "40px"
    })
}

export function update_left_panel(scene: Phaser.Scene) {
    hand_counter.setText(play_counter.toString())
    discard.setText(discard_counter.toString())
    if (result_of_hand.length === 2) {
        chips.setText(result_of_hand[0].toString())
        mult.setText(result_of_hand[1].toString())
        type_of_hand.setText(poker_hand)
    }
}