import mongoose, { Schema, Document } from 'mongoose';

export interface ICityStamp {
  id: string;
  code: string;
  name: string;
  country: string;
  image?: string;
}

export interface IExpeditionCity extends Document {
  cityId: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  icon: string; // 'monument' | 'mountain' | 'castle' | 'coast' | 'oriental' | 'metropolis'
  minLevel: number;
  rewardMultiplier: number; // e.g. 1.0, 1.5, 2.0
  cageDropChance: number; // percentage (0 - 100), e.g. 10 for 10%
  stamps: ICityStamp[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CityStampSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
    image: { type: String, default: null },
  },
  { _id: false }
);

const ExpeditionCitySchema: Schema = new Schema(
  {
    cityId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'monument' },
    minLevel: { type: Number, default: 1 },
    rewardMultiplier: { type: Number, default: 1.0, min: 0.1, max: 10.0 },
    cageDropChance: { type: Number, default: 5, min: 0, max: 100 },
    stamps: { type: [CityStampSchema], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DEFAULT_EXPEDITION_CITIES = [
  {
    cityId: 'budapest',
    name: 'Budapest',
    country: 'Magyarország',
    lat: 47.4979,
    lng: 19.0402,
    description: 'A Duna gyöngyszeme, fenséges hidakkal és a Parlament patinás kupolájával.',
    icon: 'castle',
    minLevel: 1,
    rewardMultiplier: 1.0,
    cageDropChance: 5,
    stamps: [
      { id: 'hu_bp_parliament', code: 'HU-BP01', name: 'Országház Bélyeg', country: 'Magyarország' },
      { id: 'hu_bp_chainbridge', code: 'HU-BP02', name: 'Lánchíd Bélyeg', country: 'Magyarország' },
    ],
    isActive: true,
    order: 1,
  },
  {
    cityId: 'vienna',
    name: 'Bécs',
    country: 'Ausztria',
    lat: 48.2082,
    lng: 16.3738,
    description: 'Császári paloták, klasszikus kávéházak és a gótikus Szent István-dóm városa.',
    icon: 'monument',
    minLevel: 1,
    rewardMultiplier: 1.2,
    cageDropChance: 8,
    stamps: [
      { id: 'at_vie_stephan', code: 'AT-VIE01', name: 'Szent István-székesegyház', country: 'Ausztria' },
      { id: 'at_vie_schoenbrunn', code: 'AT-VIE02', name: 'Schönbrunni Kastély', country: 'Ausztria' },
    ],
    isActive: true,
    order: 2,
  },
  {
    cityId: 'prague',
    name: 'Prága',
    country: 'Csehország',
    lat: 50.0755,
    lng: 14.4378,
    description: 'A száztornyú város aranyozott kupoláival és a varázslatos Károly híddal.',
    icon: 'castle',
    minLevel: 1,
    rewardMultiplier: 1.3,
    cageDropChance: 10,
    stamps: [
      { id: 'cz_prg_charles', code: 'CZ-PRG01', name: 'Károly híd Bélyeg', country: 'Csehország' },
      { id: 'cz_prg_astronomical', code: 'CZ-PRG02', name: 'Orloj Csillagászati Óra', country: 'Csehország' },
    ],
    isActive: true,
    order: 3,
  },
  {
    cityId: 'rome',
    name: 'Róma',
    country: 'Olaszország',
    lat: 41.9028,
    lng: 12.4964,
    description: 'Az Örök Város, az ókori birodalom szíve a Colosseummal és a Vatikánnal.',
    icon: 'monument',
    minLevel: 2,
    rewardMultiplier: 1.6,
    cageDropChance: 12,
    stamps: [
      { id: 'it_rom_colosseum', code: 'IT-ROM01', name: 'Colosseum Aranypecsét', country: 'Olaszország' },
      { id: 'it_rom_vatican', code: 'IT-ROM02', name: 'Szent Péter Bélyeg', country: 'Olaszország' },
    ],
    isActive: true,
    order: 4,
  },
  {
    cityId: 'paris',
    name: 'Párizs',
    country: 'Franciaország',
    lat: 48.8566,
    lng: 2.3522,
    description: 'A fények és a szerelem városa a Szajna partján, az Eiffel-torony árnyékában.',
    icon: 'metropolis',
    minLevel: 2,
    rewardMultiplier: 1.8,
    cageDropChance: 15,
    stamps: [
      { id: 'fr_par_eiffel', code: 'FR-PAR01', name: 'Eiffel-torony Klasszikus', country: 'Franciaország' },
      { id: 'fr_par_louvre', code: 'FR-PAR02', name: 'Louvre Piramis Bélyeg', country: 'Franciaország' },
    ],
    isActive: true,
    order: 5,
  },
  {
    cityId: 'london',
    name: 'London',
    country: 'Egyesült Királyság',
    lat: 51.5074,
    lng: -0.1278,
    description: 'Ködös Temze-part, a Big Ben harangszava és a királyi postagalambok hagyománya.',
    icon: 'metropolis',
    minLevel: 2,
    rewardMultiplier: 2.0,
    cageDropChance: 16,
    stamps: [
      { id: 'uk_lon_bigben', code: 'UK-LON01', name: 'Big Ben Királyi Bélyeg', country: 'Egyesült Királyság' },
      { id: 'uk_lon_towerbridge', code: 'UK-LON02', name: 'Tower Bridge Pecsét', country: 'Egyesült Királyság' },
    ],
    isActive: true,
    order: 6,
  },
  {
    cityId: 'istanbul',
    name: 'Isztambul',
    country: 'Törökország',
    lat: 41.0082,
    lng: 28.9784,
    description: 'Európa és Ázsia találkozása a Boszporusz mentén, fenséges minaretekkel.',
    icon: 'oriental',
    minLevel: 3,
    rewardMultiplier: 2.3,
    cageDropChance: 18,
    stamps: [
      { id: 'tr_ist_hagia', code: 'TR-IST01', name: 'Hagia Sophia Bélyeg', country: 'Törökország' },
      { id: 'tr_ist_bosphorus', code: 'TR-IST02', name: 'Boszporusz-szoros Pecsét', country: 'Törökország' },
    ],
    isActive: true,
    order: 7,
  },
  {
    cityId: 'cairo',
    name: 'Kairó',
    country: 'Egyiptom',
    lat: 30.0444,
    lng: 31.2357,
    description: 'Ősi fáraók birodalma a Nílus partján, az évezredes gízai piramisok mellett.',
    icon: 'oriental',
    minLevel: 3,
    rewardMultiplier: 2.6,
    cageDropChance: 20,
    stamps: [
      { id: 'eg_cai_pyramids', code: 'EG-CAI01', name: 'Gízai Piramisok Aranybélyeg', country: 'Egyiptom' },
      { id: 'eg_cai_sphinx', code: 'EG-CAI02', name: 'Szfinx Titokpecsét', country: 'Egyiptom' },
    ],
    isActive: true,
    order: 8,
  },
  {
    cityId: 'tokyo',
    name: 'Tokió',
    country: 'Japán',
    lat: 35.6762,
    lng: 139.6503,
    description: 'Távoli felkelő nap országa, neonfényes sugárutak és a szent Fudzsi sziluettje.',
    icon: 'metropolis',
    minLevel: 3,
    rewardMultiplier: 3.2,
    cageDropChance: 25,
    stamps: [
      { id: 'jp_tyo_fuji', code: 'JP-TYO01', name: 'Fudzsi-hegy Szent Bélyeg', country: 'Japán' },
      { id: 'jp_tyo_cherry', code: 'JP-TYO02', name: 'Cseresznyevirágzás Pecsét', country: 'Japán' },
    ],
    isActive: true,
    order: 9,
  },
];

export default mongoose.models.ExpeditionCity || mongoose.model<IExpeditionCity>('ExpeditionCity', ExpeditionCitySchema);
