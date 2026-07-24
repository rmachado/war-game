export type ObjectiveType =
  | 'conquer_24'
  | 'conquer_18_with_2'
  | 'continents_na_africa'
  | 'continents_eu_oceania_plus_one'
  | 'continents_eu_sa_plus_one'
  | 'continents_asia_africa'
  | 'continents_asia_sa'
  | 'continents_na_oceania'
  | 'destroy_black'
  | 'destroy_red'
  | 'destroy_green'
  | 'destroy_blue'
  | 'destroy_white'
  | 'destroy_yellow';

export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetColor?: string;
}

export const OBJECTIVES: Objective[] = [
  { id: 'obj-1', type: 'conquer_24', description: 'Conquistar 24 TERRITORIOS a su elección' },
  { id: 'obj-2', type: 'conquer_18_with_2', description: 'Conquistar 18 TERRITORIOS ocupados cada uno de ellos con un mínimo de 2 ejércitos' },
  { id: 'obj-3', type: 'continents_na_africa', description: 'Conquistar en su totalidad AMÉRICA DEL NORTE y ÁFRICA' },
  { id: 'obj-4', type: 'continents_eu_oceania_plus_one', description: 'Conquistar en su totalidad EUROPA, OCEANÍA y un tercer continente a su elección' },
  { id: 'obj-5', type: 'continents_eu_sa_plus_one', description: 'Conquistar en su totalidad EUROPA, AMÉRICA DEL SUR y un tercer continente a su elección' },
  { id: 'obj-6', type: 'continents_asia_africa', description: 'Conquistar en su totalidad ASIA y ÁFRICA' },
  { id: 'obj-7', type: 'continents_asia_sa', description: 'Conquistar en su totalidad ASIA y AMÉRICA DEL SUR' },
  { id: 'obj-8', type: 'continents_na_oceania', description: 'Conquistar en su totalidad AMÉRICA DEL NORTE y OCEANÍA' },
  { id: 'obj-9', type: 'destroy_black', description: 'Destruir totalmente LOS EJÉRCITOS NEGROS', targetColor: 'black' },
  { id: 'obj-10', type: 'destroy_red', description: 'Destruir totalmente LOS EJÉRCITOS ROJOS', targetColor: 'red' },
  { id: 'obj-11', type: 'destroy_green', description: 'Destruir totalmente LOS EJÉRCITOS VERDES', targetColor: 'green' },
  { id: 'obj-12', type: 'destroy_blue', description: 'Destruir totalmente LOS EJÉRCITOS AZULES', targetColor: 'blue' },
  { id: 'obj-13', type: 'destroy_white', description: 'Destruir totalmente LOS EJÉRCITOS BLANCOS', targetColor: 'white' },
  { id: 'obj-14', type: 'destroy_yellow', description: 'Destruir totalmente LOS EJÉRCITOS AMARILLOS', targetColor: 'yellow' },
];

export function getObjective(id: string): Objective | undefined {
  return OBJECTIVES.find(o => o.id === id);
}
