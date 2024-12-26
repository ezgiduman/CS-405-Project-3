/**
 * @class SceneNode
 * @desc Represents a node in the scene graph that handles hierarchical transformations.
 * @property {MeshDrawer} meshDrawer - Used to draw the current node's mesh.
 * @property {TRS} trs - The transformation object for the current node.
 * @property {SceneNode} parent - Parent node in the scene graph.
 * @property {Array} children - List of child nodes in the scene graph.
 */

class SceneNode {
    constructor(meshDrawer, trs, parent = null) {
        this.meshDrawer = meshDrawer;
        this.trs = trs;
        this.parent = parent;
        this.children = [];

        
        if (parent) {
            parent.addChild(this);
        }
    }

    // Adds a child node to the current node
    addChild(node) {
        this.children.push(node);
    }

    draw(mvp, modelView, normalMatrix, modelMatrix) {
        /**
         * @Task1 : Perform transformations and draw the current node and its children.
         */

        //  Calculate the transformatioan
        const currentTransform = this.trs.getTransformationMatrix();

        // Update transformationn 
        const updatedMvp = MatrixMult(mvp, currentTransform);
        const updatedModelView = MatrixMult(modelView, currentTransform);
        const updatedNormals = MatrixMult(normalMatrix, currentTransform);
        const updatedModel = MatrixMult(modelMatrix, currentTransform);

        // Render the mesh
        if  (this.meshDrawer) 
        {
            this.meshDrawer.draw(updatedMvp, updatedModelView, updatedNormals, updatedModel);
        }

        //  Recursively draw all child nodes
        for (const childNode of this.children) 
        {
             childNode.draw(updatedMvp,  updatedModelView, updatedNormals, updatedModel);
        }
    }
}
