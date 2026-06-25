import { Obj3D } from './Obj3D.js';
import { CvWireframe } from './CvWireFrame.js';

interface DatVertex {
  id: number;
  x: number;
  y: number;
  z: number;
}

interface DatModel {
  vertices: DatVertex[];
  faces: string[];
}

const canvas = <HTMLCanvasElement>document.getElementById('circlechart');
const graphics = <CanvasRenderingContext2D>canvas.getContext('2d');
const fileInput = <HTMLInputElement>document.getElementById('file-input');
const openButton = <HTMLButtonElement>document.getElementById('open-door');
const closeButton = <HTMLButtonElement>document.getElementById('close-door');
const animateButton = <HTMLButtonElement>document.getElementById('animate-door');
const resetButton = <HTMLButtonElement>document.getElementById('reset-view');
const eyeDown = <HTMLButtonElement>document.getElementById('eyeDown');
const eyeUp = <HTMLButtonElement>document.getElementById('eyeUp');
const eyeLeft = <HTMLButtonElement>document.getElementById('eyeLeft');
const eyeRight = <HTMLButtonElement>document.getElementById('eyeRight');
const incrDist = <HTMLButtonElement>document.getElementById('incrDist');
const decrDist = <HTMLButtonElement>document.getElementById('decrDist');
const fileContent = <HTMLPreElement>document.getElementById('contenido-archivo');
const statusText = <HTMLParagraphElement>document.getElementById('status-text');

let modelText = '';
let currentDoorAngle = 0;
let viewTheta = 0.20;
let viewPhi = 1.15;
let viewRhoFactor = 3;
let animationId = 0;
let animationDirection = 1;

function parseDat(content: string): DatModel {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const facesIndex = lines.findIndex((line) => line.toLowerCase() === 'faces:');

  if (facesIndex === -1) {
    throw new Error('El archivo no tiene la seccion Faces:');
  }

  const vertices = lines.slice(0, facesIndex)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts.length >= 4 && parts.slice(0, 4).every((value) => Number.isFinite(Number(value))))
    .map((parts) => ({
      id: Number(parts[0]),
      x: Number(parts[1]),
      y: Number(parts[2]),
      z: Number(parts[3])
    }));

  const faces = lines.slice(facesIndex + 1)
    .filter((line) => /^-?\d/.test(line));

  return { vertices, faces };
}

function serializeDat(model: DatModel): string {
  const vertices = model.vertices.map((vertex) =>
    `${vertex.id} ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)}`
  );

  return `${vertices.join('\n')}\nFaces:\n${model.faces.join('\n')}\n`;
}

function getDoorIds(model: DatModel): Set<number> {
  const ids = new Set<number>();
  const maxId = Math.max(...model.vertices.map((vertex) => vertex.id));

  // En este archivo los ultimos 24 vertices son el marco, por eso se dejan fijos.
  for (let id = 1; id <= maxId - 24; id++) {
    ids.add(id);
  }

  return ids;
}

function getHinge(model: DatModel, doorIds: Set<number>) {
  const doorVertices = model.vertices.filter((vertex) => doorIds.has(vertex.id));
  const minX = Math.min(...doorVertices.map((vertex) => vertex.x));
  const hingeVertices = doorVertices.filter((vertex) => vertex.x <= minX + 0.03);
  const totalZ = hingeVertices.reduce((total, vertex) => total + vertex.z, 0);

  return {
    x: minX,
    z: totalZ / hingeVertices.length
  };
}

function rotateDoor(model: DatModel, angle: number): DatModel {
  const doorIds = getDoorIds(model);
  const hinge = getHinge(model, doorIds);
  const radians = angle * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    vertices: model.vertices.map((vertex) => {
      if (!doorIds.has(vertex.id)) return vertex;

      const relativeX = vertex.x - hinge.x;
      const relativeZ = vertex.z - hinge.z;

      return {
        ...vertex,
        x: hinge.x + relativeX * cos - relativeZ * sin,
        z: hinge.z + relativeX * sin + relativeZ * cos
      };
    }),
    faces: [...model.faces]
  };
}

function convertForViewer(model: DatModel): DatModel {
  return {
    vertices: model.vertices.map((vertex) => ({
      ...vertex,
      y: vertex.z,
      z: vertex.y
    })),
    faces: [...model.faces]
  };
}

function renderScene() {
  if (!modelText) return;

  try {
    const originalModel = parseDat(modelText);
    const model = rotateDoor(originalModel, currentDoorAngle);
    const viewerModel = convertForViewer(model);
    const object = new Obj3D();

    object.read(serializeDat(viewerModel));
    object.theta = viewTheta;
    object.phi = viewPhi;
    object.rho = Math.min(object.rhoMax, Math.max(object.rhoMin, object.rhoMin * viewRhoFactor));

    const view = new CvWireframe(graphics, canvas);
    view.setObj(object);
    view.paint();

    statusText.textContent = `Vertices: ${model.vertices.length} | Angulo de puerta: ${Math.round(currentDoorAngle)}°`;
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : 'No se pudo leer el archivo';
  }
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  animateButton.textContent = 'Animar puerta';
}

function setDoorAngle(angle: number) {
  currentDoorAngle = angle;
  renderScene();
}

function animateDoor() {
  const tick = () => {
    currentDoorAngle += animationDirection * 1.5;

    if (currentDoorAngle >= 85) {
      currentDoorAngle = 85;
      animationDirection = -1;
    }

    if (currentDoorAngle <= 0) {
      currentDoorAngle = 0;
      animationDirection = 1;
    }

    renderScene();
    animationId = requestAnimationFrame(tick);
  };

  animateButton.textContent = 'Pausar';
  animationId = requestAnimationFrame(tick);
}

function updateView(dTheta: number, dPhi: number, rhoFactor: number) {
  viewTheta += dTheta;
  viewPhi += dPhi;
  viewRhoFactor *= rhoFactor;
  renderScene();
}

function loadFile(file: File) {
  const reader = new FileReader();

  reader.onload = (event) => {
    stopAnimation();
    modelText = String(event.target?.result ?? '');
    fileContent.textContent = modelText;
    currentDoorAngle = 0;
    renderScene();
  };

  reader.readAsText(file);
}

async function loadDefaultModel() {
  modelText = await fetch('./data/puerta_estructurado.txt').then((response) => response.text());
  fileContent.textContent = modelText;
  renderScene();
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) loadFile(file);
}, false);

openButton.addEventListener('click', () => {
  stopAnimation();
  setDoorAngle(85);
}, false);

closeButton.addEventListener('click', () => {
  stopAnimation();
  setDoorAngle(0);
}, false);

animateButton.addEventListener('click', () => {
  if (animationId) stopAnimation();
  else animateDoor();
}, false);

resetButton.addEventListener('click', () => {
  stopAnimation();
  currentDoorAngle = 0;
  viewTheta = 0.20;
  viewPhi = 1.15;
  viewRhoFactor = 3;
  renderScene();
}, false);

eyeDown.addEventListener('click', () => updateView(0, 0.1, 1), false);
eyeUp.addEventListener('click', () => updateView(0, -0.1, 1), false);
eyeLeft.addEventListener('click', () => updateView(-0.1, 0, 1), false);
eyeRight.addEventListener('click', () => updateView(0.1, 0, 1), false);
incrDist.addEventListener('click', () => updateView(0, 0, 1.2), false);
decrDist.addEventListener('click', () => updateView(0, 0, 0.85), false);

loadDefaultModel();
