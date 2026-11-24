import {
  createDalemWall, createDoor, createFoundation, createLamp, createOuterPillar,
  createPillar, createRoof, createTumpangSari, DALEM_FRAME,
} from "./joglo.js";
import {
  createBed, createBench, createChair, createCupboard, createDiningSet,
  createGamelan, createKelir, createLesehan, createStatue, createTable,
} from "./furniture.js";
import { createFenceSegment, createGate, createWell } from "./environment.js";

export const COMPONENTS = [
  { id: "bebatur", label: "Bebatur dan anak tangga", create: createFoundation },
  { id: "atap-pendopo", label: "Atap pendopo", create: createRoof },
  { id: "atap-dalem", label: "Atap dalem", create: () => createRoof(DALEM_FRAME) },
  { id: "soko-guru", label: "Soko guru", create: createPillar },
  { id: "soko-pengarak", label: "Soko pengarak", create: createOuterPillar },
  { id: "tumpang-sari", label: "Tumpang sari", create: createTumpangSari },
  { id: "dinding-gebyok", label: "Dinding gebyok", create: createDalemWall },
  { id: "pintu-gebyok", label: "Pintu gebyok", create: createDoor },
  { id: "meja", label: "Meja", create: createTable },
  { id: "kursi", label: "Kursi", create: createChair },
  { id: "meja-makan", label: "Set meja makan", create: createDiningSet },
  { id: "dipan", label: "Dipan", create: createBed },
  { id: "dipan-berkelambu", label: "Dipan berkelambu", create: () => createBed(1.8, 1.3, true) },
  { id: "lemari", label: "Lemari", create: createCupboard },
  { id: "bangku", label: "Bangku", create: createBench },
  { id: "lesehan", label: "Set lesehan", create: createLesehan },
  { id: "gamelan", label: "Gamelan", create: createGamelan },
  { id: "loro-blonyo", label: "Patung Loro Blonyo", create: createStatue },
  { id: "kelir", label: "Kelir wayang", create: createKelir },
  { id: "lampu", label: "Lampu gantung", create: createLamp },
  { id: "pagar", label: "Segmen pagar batu", create: createFenceSegment },
  { id: "gapura", label: "Gapura candi bentar", create: createGate },
  { id: "sumur", label: "Sumur", create: createWell },
];
