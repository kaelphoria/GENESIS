export const WORLD_SEED = [
 {slug:'identity',title:'IDENTITY',description:'Values, self-definition, character and beliefs',subtitle:'The person you are becoming',index:'01'},
 {slug:'intellect',title:'INTELLECT',description:'Learning, knowledge, attention and reasoning',subtitle:'The architecture of your thinking',index:'02'},
 {slug:'psyche',title:'PSYCHE',description:'Emotions, self-worth, resilience and reflection',subtitle:'Understanding your inner landscape',index:'03'},
 {slug:'physical',title:'PHYSICAL',description:'Sleep, activity, nutrition, energy and recovery',subtitle:'The foundation of your capacity',index:'04'},
 {slug:'aesthetics',title:'AESTHETICS',description:'Taste, style, visual literacy and self-expression',subtitle:'Your language of form and beauty',index:'05'},
 {slug:'connection',title:'CONNECTION',description:'Relationships, communication and boundaries',subtitle:'The quality of your bonds',index:'06'},
 {slug:'creation',title:'CREATION',description:'Talents, career, craft and projects',subtitle:'Turning possibility into form',index:'07'},
 {slug:'abundance',title:'ABUNDANCE',description:'Money, capital, resources and independence',subtitle:'Building material freedom',index:'08'},
 {slug:'spirit',title:'SPIRIT',description:'Meaning, worldview, faith and reflection',subtitle:'What gives direction and depth',index:'09'}
] as const;

export type WorldSlug = typeof WORLD_SEED[number]['slug'];

/**
 * EVENT HORIZON: explicit map from the nine conceptual planets to real GENESIS domains.
 * `domains[0]` is the primary domain opened by onSelect; the rest are related domains.
 * Never match planets to worlds by array index.
 */
export const EVENT_HORIZON_WORLDS = [
 {key:'ABUNDANCE', domains:['abundance']},
 {key:'KNOWLEDGE', domains:['intellect']},
 {key:'CONNECTION', domains:['connection']},
 {key:'PHYSICAL', domains:['physical']},
 {key:'POWER', domains:['identity']},
 {key:'CREATIVITY', domains:['creation','aesthetics']},
 {key:'HARMONY', domains:['psyche']},
 {key:'LOVE', domains:['connection']},
 {key:'FREEDOM', domains:['spirit']}
] as const satisfies readonly {key:string; domains:readonly [WorldSlug, ...WorldSlug[]]}[];

export type EventHorizonKey = typeof EVENT_HORIZON_WORLDS[number]['key'];
