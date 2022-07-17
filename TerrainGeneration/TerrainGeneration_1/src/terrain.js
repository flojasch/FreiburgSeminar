import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import {
  math
} from './math.js';

export const terrain = (function () {
  const TERRAIN_SIZE = 50000;

  class Heightmap {
    constructor(img) {
      this._data = this._GetImageData(img);
    }

    _GetImageData(image) {
      //um die Daten des Bildes zu bekommen, wird es zunächst auf eine Leinwand gezeichnet, aber nicht dargestellt
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);

      return context.getImageData(0, 0, image.width, image.height);
    }

    Get(x, y) {
      const _GetPixelAsFloat = (x, y) => {
        const position = (x + this._data.width * y) * 4;
        const data = this._data.data;
        return data[position] / 255.0;
        //hier wird der r-Wert ausgelesen. data[position+1] ist g, data[position+2] ist b, 
        //und data[position+3] ist alpha.
      }

      // Interpolation in x und in y-Richtung um die Hoehen zwischen ganzzahligen Koordinaten zu ermitteln(Filter)

      const dimensions = new THREE.Vector2(TERRAIN_SIZE, TERRAIN_SIZE);

      const xf = 1 - math.sat((x + TERRAIN_SIZE / 2) / dimensions.x); // -terrainsize/2, terrainsize/2 wird auf 1,0 abgebildet
      const yf = math.sat((y + TERRAIN_SIZE / 2) / dimensions.y);
      const w = this._data.width - 1;
      const h = this._data.height - 1;

      const x1 = Math.floor(xf * w); //0,1 wird auf ganze Zahl zwischen 0 und w abgebildet
      const y1 = Math.floor(yf * h);
      const x2 = math.clamp(x1 + 1, 0, w); // x2 ist einfach x1+1 und bleibt w falls es w ist 
      const y2 = math.clamp(y1 + 1, 0, h);

      const xp = xf * w - x1; // ein Wert zwischen 0 und 1
      const yp = yf * h - y1;

      const p11 = _GetPixelAsFloat(x1, y1); // die Hoehen auf den Ecken eines Quadrates
      const p21 = _GetPixelAsFloat(x2, y1);
      const p12 = _GetPixelAsFloat(x1, y2);
      const p22 = _GetPixelAsFloat(x2, y2);

      const px1 = math.lerp(xp, p11, p21); // Interpolation fuer y=y1 
      const px2 = math.lerp(xp, p12, p22); // Interpolation fuer y=y2

      return math.lerp(yp, px1, px2); // Interpolation in y-Richtung
    }
  }

  class TerrainChunk {
    constructor(params) {
      this._group = params.group;
      this._height = 2000;
      this._size = TERRAIN_SIZE;
      this._res = 500;
      this._Init();
      this.loadImage();
    }
    Destroy() {
      this._group.remove(this._plane);
    }

    _Init() {
      const geometry = new THREE.PlaneGeometry(this._size, this._size, this._res, this._res);
      console.log(geometry);
      // du solltest dir unbedingt die Struktur des Geomety Objektes in der Console anschauen
      // dann verstehst du die Build() Methode besser.
      const material = new THREE.MeshStandardMaterial({
        wireframe: false, //dieser Parameter kann über die GUI verändert werden.
        color: 0xFFFFFF,
        side: THREE.FrontSide,
        vertexColors: THREE.VertexColors,
      })
      this._plane = new THREE.Mesh(geometry, material);
      this._plane.castShadow = false;
      this._plane.receiveShadow = true;
      this._group.add(this._plane);
    }

    loadImage() {
      const loader = new THREE.TextureLoader(this._manager);
      loader.load('./resources/seealpen.png', (result) => {
        const heightmap = new Heightmap(result.image);
        this.Build(heightmap);
      });
    }

    setColor(h, vertexColours) {
      const GRAY = new THREE.Color(0xFFFFFF);
      let a = math.sat(h / this._height); // sat(x) liefert 0 für x<0 und 1 für x>1 ansonsten x. 
      let vc = new THREE.Color(0x46b00c); //gruen
      vc.lerp(GRAY, a); //lineare Interpolation zwischen grau und gruenn
      vertexColours.push(vc);
    }

    Build(heightmap) {
      const heights = [];
      for (let k in this._plane.geometry.vertices) {
        const v = this._plane.geometry.vertices[k];
        v.z = this._height * heightmap.Get(v.x, v.y);
        heights[k]=v.z;
      }

      for (let f of this._plane.geometry.faces) {
        const vertexColors = [];
      //f.a,f.b,f.c geben die Nummern der Ecken (vertices) der Dreiecksflaeche an. 
      //heights[f.a] ist also das f.a-te Element der Liste, die in Build(heightmap) erstellt wurde
        this.setColor(heights[f.a], vertexColors);
        this.setColor(heights[f.b], vertexColors);
        this.setColor(heights[f.c], vertexColors);

        f.vertexColors = vertexColors;
      }
      this._plane.geometry.elementsNeedUpdate = true;
      this._plane.geometry.verticesNeedUpdate = true;
      this._plane.geometry.computeVertexNormals();
    }
  }

  return {
    TerrainChunk: TerrainChunk,
  }
})();