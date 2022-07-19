'use strict'

import Input from "./input.js"
import AppState from "./appstate.js"
import Shader from "./shader.js"
import { OrbitMovement } from "./movement.js"

class App
{

    constructor( scene )
    {

        console.log( "Initializing App" )

        // canvas & gl
        this.canvas = document.getElementById( "canvas" )
        this.canvas.addEventListener( "contextmenu", event => event.preventDefault( ) );
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.gl = this.initGl( )

        // save the scene
        this.scene = scene.scene

        this.pointLights = []
        this.directionalLights = []
        this.setLights()

        // shaders
        console.log( "Loading Shaders" )
        this.flat_shader = new Shader( this.gl, "../shaders/flat.vert.glsl", "../shaders/flat.frag.glsl" )
        this.wireframe_shader = new Shader( this.gl, "../shaders/wireframe.vert.glsl", "../shaders/wireframe.frag.glsl" )
        this.gouraud_shader = new Shader( this.gl, "../shaders/gouraud.vert.glsl", "../shaders/gouraud.frag.glsl" )
        this.phong_shader = new Shader( this.gl, "../shaders/phong.vert.glsl", "../shaders/phong.frag.glsl" )
        this.shader = this.flat_shader

        // camera
        this.camera = scene.camera
        this.initCamera()

        // movement
        this.movement = new OrbitMovement( this, 0.4 )

        // resize handling
        this.resizeToDisplay( )
        window.onresize = this.resizeToDisplay.bind( this )

        // app state
        this.app_state = new AppState( this )

        
    }

    /**
     * Initialize the camera and update settings
     */
    initCamera( )
    {
        this.camera.aspect = this.canvas.width / this.canvas.height
        this.camera.canvas_height = this.canvas.height
        this.camera.canvas_width = this.canvas.width
        this.camera.update( )
    }

    /** 
     * Resizes camera and canvas to pixel-size-corrected display size
     */
    resizeToDisplay( )
    {

        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        this.camera.canvas_height = this.canvas.height
        this.camera.canvas_width = this.canvas.width
        this.camera.aspect = this.canvas.width / this.canvas.height
        this.camera.update( )

    }

    /**
     * Initializes webgl2 with settings
     * @returns { WebGL2RenderingContext | null }
     */
    initGl( )
    {

        let gl = this.canvas.getContext( "webgl2" )

        if ( !gl )
        {
            alert( "Could not initialize WebGL2." )
            return null
        }

        gl.enable( gl.CULL_FACE ); // Turn on culling. By default backfacing triangles will be culled.
        gl.enable( gl.DEPTH_TEST ); // Enable the depth buffer
        gl.clearDepth( 1.0 );
        gl.clearColor( 1, 1, 1, 1 );
        gl.depthFunc( gl.LEQUAL ); // Near things obscure far things

        return gl
    }

    /**
     * Starts render loop
     */
    start( )
    {

        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    /**
     * Called every frame, triggers input and app state update and renders a frame
     */
    update( )
    {

        this.app_state.update( )
        this.movement.update( )
        Input.update( )
        //this.updateLights()
        this.render( )
        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    setLights()
    {
        this.pointLights = []
        this.directionalLights = []
        this.addLight(this.scene)
    }

    addLight( node )
    {
        if (node.type == "pointLight")
        {
            this.pointLights.push(node)
        }
        else if (node.type == "directionalLight")
        {
            this.directionalLights.push(node)
        }


        for ( let child of node.children )
        {
            this.addLight( child )
        }

    }


    /**
     * Main render loop
     */
    render( )
    {

        // clear the screen
        this.gl.viewport( 0, 0, this.gl.canvas.width, this.gl.canvas.height )
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT )

        this._render( this.scene )

    }

    /**
     * Recursively renders the SceneNode hierarchy
     * 
     * @param {SceneNode} node node to render and process
     */
    _render( node )
    {
        this.shader.use( )

        // Projection
        const mvp = mat4.mul(
            mat4.create( ),
            this.camera.vp( ),
            node.getTransform( ) )
        this.shader.setUniform4x4f( "u_mvp_matrix", mvp )
        this.shader.setUniform4x4f( "u_m_matrix", node.getTransform())
        this.shader.setUniform4x4f( "u_m_matrix_frag", node.getTransform())
        this.shader.setUniform3f( "viewPos", this.camera.position)

        //Need the scale of the world for the light atenuation when zooming in and out
        this.shader.setUniform1f( "worldScale", mat4.getScaling(vec3.create(), this.scene.getTransform())[0])
        this.addLightsToShader()


        node.render( this.gl, this.shader, this.app_state.useBilinear )

        for ( let child of node.children )
            this._render( child )
    }

    addLightsToShader()
    {
        for (let i = 0; i < this.pointLights.length; i++)
        {
            let uniformName = new String("pointLights[" + i + "].")
            //Need to get the position from the transform matrix
            this.shader.setUniform3f(uniformName + "location", vec3.transformMat4(vec3.create(), vec3.create(), this.pointLights[i].getTransform()))
            this.shader.setUniform3f(uniformName + "color", this.pointLights[i].color)
            this.shader.setUniform1f(uniformName + "power", this.pointLights[i].power)
        }
        for (let i = 0; i < this.directionalLights.length; i++)
        {
            let uniformName = new String("directionalLights[" + i + "].")

            //Convert direction vector to world space
            let sceneTrasformMat = this.scene.getTransform()
            let vectorMatrix = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), sceneTrasformMat))
            let worldSpaceDirection = vec3.transformMat4(vec3.create(), this.directionalLights[i].direction, vectorMatrix)

            this.shader.setUniform3f(uniformName + "direction", worldSpaceDirection)

            this.shader.setUniform3f(uniformName + "color", this.directionalLights[i].color)
            this.shader.setUniform1f(uniformName + "power", this.directionalLights[i].power)
        }
        this.shader.setUniform1i("numPointLights", this.pointLights.length)
        this.shader.setUniform1i("numDirLights", this.directionalLights.length)
    }

}

export default App
