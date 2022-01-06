export const quadtree = (function () {

  class QuadTree {
    constructor(params) {
      this._cam = params.cam;
      this.MinSize = 50;
      this._root = {
        children: [],
        x: params.x,
        y: params.y,
        size: params.size,
      };
      this.GrowTree();
    }

    Split(node) {
      for (let i = -1; i < 2; i += 2) {
        for (let j = -1; j < 2; j += 2) {
          const size = node.size / 2;
          const x = node.x + i * size;
          const y = node.y + j * size;
          node.children.push({
            children: [],
            x: x,
            y: y,
            size: size
          })
        }
      }
    }

    Grow(children) {
      for (let child of children) {
        const x = this._cam.x - child.x;
        const y = this._cam.z + child.y;
        let rr=x*x+y*y;
        if (rr < child.size*child.size*4) {
          this.Split(child);
          if (child.size/2 > this.MinSize) {
            this.Grow(child.children);
          }
        }
      }
    }

    Update(node){
      const x = this._cam.x - node.x;
      const y = this._cam.z + node.y;
      let rr=x*x+y*y;
      if (rr < node.size*node.size*4 && node.size > this.MinSize) {
        this.Split(node);
      }
      return node.children;
    }

    GrowTree() {
      this.Split(this._root);
      this.Grow(this._root.children);
    }

    _GetLeaves(node, target) {
      if (node.children.length == 0) {
        target.push(node);
        return;
      }
      for (let child of node.children) {
        this._GetLeaves(child, target);
      }
    }

    GetLeaves() {
      const children = [];
      this._GetLeaves(this._root, children);
      return children;
    }

  }

  return {
    QuadTree: QuadTree
  }
})();