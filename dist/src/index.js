var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Obj3D } from './Obj3D.js';
import { CvWireframe } from './CvWireFrame.js';
const canvas = document.getElementById('circlechart');
const graphics = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const openButton = document.getElementById('open-door');
const closeButton = document.getElementById('close-door');
const animateButton = document.getElementById('animate-door');
const resetButton = document.getElementById('reset-view');
const eyeDown = document.getElementById('eyeDown');
const eyeUp = document.getElementById('eyeUp');
const eyeLeft = document.getElementById('eyeLeft');
const eyeRight = document.getElementById('eyeRight');
const incrDist = document.getElementById('incrDist');
const decrDist = document.getElementById('decrDist');
const fileContent = document.getElementById('contenido-archivo');
const statusText = document.getElementById('status-text');
let modelText = '';
let currentDoorAngle = 0;
let viewTheta = 0.20;
let viewPhi = 1.15;
let viewRhoFactor = 3;
let animationId = 0;
let animationDirection = 1;
function parseDat(content) {
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
function serializeDat(model) {
    const vertices = model.vertices.map((vertex) => `${vertex.id} ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)}`);
    return `${vertices.join('\n')}\nFaces:\n${model.faces.join('\n')}\n`;
}
function getDoorIds(model) {
    const ids = new Set();
    const maxId = Math.max(...model.vertices.map((vertex) => vertex.id));
    // En este archivo los ultimos 24 vertices son el marco, por eso se dejan fijos.
    for (let id = 1; id <= maxId - 24; id++) {
        ids.add(id);
    }
    return ids;
}
function getHinge(model, doorIds) {
    const doorVertices = model.vertices.filter((vertex) => doorIds.has(vertex.id));
    const minX = Math.min(...doorVertices.map((vertex) => vertex.x));
    const hingeVertices = doorVertices.filter((vertex) => vertex.x <= minX + 0.03);
    const totalZ = hingeVertices.reduce((total, vertex) => total + vertex.z, 0);
    return {
        x: minX,
        z: totalZ / hingeVertices.length
    };
}
function rotateDoor(model, angle) {
    const doorIds = getDoorIds(model);
    const hinge = getHinge(model, doorIds);
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
        vertices: model.vertices.map((vertex) => {
            if (!doorIds.has(vertex.id))
                return vertex;
            const relativeX = vertex.x - hinge.x;
            const relativeZ = vertex.z - hinge.z;
            return Object.assign(Object.assign({}, vertex), { x: hinge.x + relativeX * cos - relativeZ * sin, z: hinge.z + relativeX * sin + relativeZ * cos });
        }),
        faces: [...model.faces]
    };
}
function convertForViewer(model) {
    return {
        vertices: model.vertices.map((vertex) => (Object.assign(Object.assign({}, vertex), { y: vertex.z, z: vertex.y }))),
        faces: [...model.faces]
    };
}
function renderScene() {
    if (!modelText)
        return;
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
    }
    catch (error) {
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
function setDoorAngle(angle) {
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
function updateView(dTheta, dPhi, rhoFactor) {
    viewTheta += dTheta;
    viewPhi += dPhi;
    viewRhoFactor *= rhoFactor;
    renderScene();
}
function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        var _a, _b;
        stopAnimation();
        modelText = String((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : '');
        fileContent.textContent = modelText;
        currentDoorAngle = 0;
        renderScene();
    };
    reader.readAsText(file);
}
function loadDefaultModel() {
    return __awaiter(this, void 0, void 0, function* () {
        modelText = yield fetch('./data/puerta_estructurado.txt').then((response) => response.text());
        fileContent.textContent = modelText;
        renderScene();
    });
}
fileInput.addEventListener('change', () => {
    var _a;
    const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (file)
        loadFile(file);
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
    if (animationId)
        stopAnimation();
    else
        animateDoor();
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
