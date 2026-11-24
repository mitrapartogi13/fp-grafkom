import {
  createDalemBackWall, createDalemSideWall, createDalemWall, createDoor, createFoundation,
  createLamp, createOuterPillar, createPillar, createRoof, createRoofGutter,
  createSenthongCurtains, createSenthongPartition, createTumpangSari, DALEM_FRAME,
} from "./joglo.js";
import {
  createBed, createBench, createChair, createCupboard, createDiningSet,
  createGamelan, createKelir, createLesehan, createStatue, createTable,
} from "./furniture.js";
import { createFenceSegment, createGate, createWell } from "./environment.js";
import {
  createCoconutTree, createFlowers, createGrass, createGround, createLotus, createPineTree,
  createPond, createRocks, createRoundTree, createShrub, createSteppingStone, createStonePath,
  createWater, createYard,
} from "./landscape.js";

export const COMPONENT_GROUPS = [
  {
    label: "Bangunan",
    items: [
      { id: "bebatur", label: "Bebatur dan anak tangga", create: createFoundation },
      { id: "atap-pendopo", label: "Atap pendopo", create: createRoof },
      { id: "atap-dalem", label: "Atap dalem", create: () => createRoof(DALEM_FRAME) },
      { id: "soko-guru", label: "Soko guru", create: createPillar },
      { id: "soko-pengarak", label: "Soko pengarak", create: createOuterPillar },
      { id: "tumpang-sari", label: "Tumpang sari", create: createTumpangSari },
      { id: "dinding-gebyok", label: "Dinding gebyok", create: createDalemWall },
      { id: "pintu-gebyok", label: "Pintu gebyok", create: createDoor },
      { id: "dinding-samping", label: "Dinding samping dalem", create: createDalemSideWall },
      { id: "dinding-belakang", label: "Dinding belakang dalem", create: createDalemBackWall },
      { id: "sekat-senthong", label: "Sekat senthong", create: createSenthongPartition },
      { id: "tirai-senthong", label: "Tirai senthong", create: createSenthongCurtains },
      { id: "talang-atap", label: "Talang penghubung atap", create: createRoofGutter },
    ],
  },
  {
    label: "Perabot",
    items: [
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
    ],
  },
  {
    label: "Halaman",
    items: [
      { id: "rumput", label: "Rumput", create: createGrass },
      { id: "air", label: "Air kolam", create: createWater },
      { id: "pohon", label: "Pohon berkanopi bulat", create: createRoundTree },
      { id: "cemara", label: "Pohon cemara", create: createPineTree },
      { id: "kelapa", label: "Pohon kelapa", create: createCoconutTree },
      { id: "batu", label: "Batu alam", create: createRocks },
      { id: "batu-pijakan", label: "Batu pijakan", create: createSteppingStone },
      { id: "jalan-setapak", label: "Jalan setapak", create: createStonePath },
      { id: "semak", label: "Semak", create: createShrub },
      { id: "bunga", label: "Bunga taman", create: createFlowers },
      { id: "teratai", label: "Teratai", create: createLotus },
      { id: "kolam", label: "Kolam teratai", create: createPond },
      { id: "tanah", label: "Tanah dasar", create: createGround },
      { id: "halaman", label: "Permukaan halaman", create: createYard },
      { id: "pagar", label: "Segmen pagar batu", create: createFenceSegment },
      { id: "gapura", label: "Gapura candi bentar", create: createGate },
      { id: "sumur", label: "Sumur", create: createWell },
    ],
  },
];

export const COMPONENTS = COMPONENT_GROUPS.flatMap(({ items }) => items);
