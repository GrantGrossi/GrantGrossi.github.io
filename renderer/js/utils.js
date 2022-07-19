'use strict'

import SceneNode from "./scenenode.js"
import ObjectNode from "./object.js"
import {PerspectiveCamera, OrthographicCamera} from "./camera.js"
import {PointLight, DirectionalLight} from "./light.js"

/**
 * Clamps a number between two numbers
 * @param { Number } number The number to clamp
 * @param { Number } min The minimum used for clamping
 * @param { Number } max The maximum used for clamping
 * @returns { Number } The clamped number
 */
function clamp( number, min, max )
{

    return Math.max( min, Math.min( number, max ) )

}

/**
 * Converts degrees to radians
 * @param { Number } deg The number in degrees
 * @returns { Number }The angle in radians
 */
function deg2rad( deg )
{

    return ( deg * Math.PI ) / 180

}

/**
 * Converts a hex color string to a normalized rgba array
 * @param { String } hex The hex color as a string
 * @returns { Array<number> } The color as normalized values
 */
function hex2rgb( hex )
{

    let rgb = hex.match( /\w\w/g )
        .map( x => parseInt( x, 16 ) / 255 )
    return vec3.fromValues( rgb[ 0 ], rgb[ 1 ], rgb[ 2 ] )

}

/**
 * Returns the mouse coordinates relative to a clicking target, in our case the canvas
 * @param event The mouse click event
 * @returns { { x: number, y: number } } The x and y coordinates relative to the canvas
 */
 function getRelativeMousePosition( event )
 {
 
     let target = event.target
 
     // if the mouse is not over the canvas, return invalid values
     if ( target.id != 'canvas' )
     {
 
         return {
 
             x: -Infinity,
             y: +Infinity,
 
         }
 
     }
 
     target = target || event.target;
     let rect = target.getBoundingClientRect( );
 
     return {
 
         x: event.clientX - rect.left,
         y: event.clientY - rect.top,
 
     }
 
 }

/**
 * Loads a given URL; this is used to load the shaders from file
 * @param { String } url The relative url to the file to be loaded
 * @returns { String | null } The external file as text
 */
function loadExternalFile( url )
{

    let req = new XMLHttpRequest( )
    req.open( "GET", url, false )
    req.send( null )
    return ( req.status == 200 ) ? req.responseText : null

}

/**
 * Loads a given .obj file and builds an object from it with vertices, colors and normals
 * @param { String } url The url to the file
 * @param { Array.<Number> } fallback_color A default color to use if the OBJ does not define vertex colors
 * @returns { Array.<Number> } The complete, interleaved vertex buffer object containing vertices, colors and normals
 */
function loadObjFile( url, fallback_color )
{

    let raw = loadExternalFile( url )

    let vertices = [ ]
    let colors = [ ]
    let normals = [ ]
    let textureVerticies = [ ]
    let vertex_ids = [ ]
    let normal_ids = [ ]
    let texture_ids = [ ]

    for ( let line of raw.split( '\n' ) )
    {

        switch ( line.split( ' ' )[ 0 ] )
        {

            case 'v':
                parseObjVertex( line, vertices )
                parseObjColor( line, colors, fallback_color )
                break
            case 'vn':
                parseObjNormal( line, normals )
                break
            case 'vt':
                parseObjTextureVerticies( line, textureVerticies )
                break
            case 'f':
                parseObjIds( line, vertex_ids, normal_ids, texture_ids )

        }
    }

    //Create a normal vector for each vertex from the data
    let vertexNormalVectors = new Array(vertices.length / 3)
    for (let i = 0; i < vertexNormalVectors.length; i++)
    {
        vertexNormalVectors[i] = vec3.create()
    }
    for (let i = 0; i < vertex_ids.length; i++)
    {
        //Each time a vertex is referenced, find its normal vector and add the normal of its associated face normal
        vec3.add(vertexNormalVectors[vertex_ids[i]], vertexNormalVectors[vertex_ids[i]], vec3.fromValues(normals[ normal_ids[i] * 3], normals[ (normal_ids[i] * 3) + 1], normals[ (normal_ids[i] * 3) + 2]))
    }

    //Normalize and split the vertex normal vectors into individual elements
    let vertexNormals = []
    for (let i = 0; i < vertexNormalVectors.length; i++)
    {
        let vector = vertexNormalVectors[i]
        vec3.normalize(vector, vector)
        vertexNormals.push(vector[0], vector[1], vector[2])
    }



    let allVerticies = [ ]
    let allNormals = [ ]
    let allColors = [ ]
    for ( let i = 0; i < vertex_ids.length; i++ )
    {
        const vid = ( vertex_ids[ i ] * 3 )

        allVerticies.push(vertices[vid], vertices[vid + 1], vertices[vid + 2])
        allNormals.push( vertexNormals[ vid ], vertexNormals[ vid + 1 ], vertexNormals[ vid + 2 ] )
        allColors.push( colors[ vid ], colors[ vid + 1 ], colors[ vid + 2 ] )
    }

    let allTextureVerticies = [ ]
    for ( let i = 0; i < texture_ids.length; i++)
    {
        const temp = texture_ids[i] * 2
        allTextureVerticies.push(textureVerticies[temp], textureVerticies[temp + 1])
    }



    //Tangent and bitangent calculations
    let vertexTangents = [ ]
    let vertexBitangents = [ ]
    for (let i = 0; i < allVerticies.length/3; i += 3)
    {
        let vid = i * 3
        let uvid = i * 2

        let v0 = vec3.fromValues(allVerticies[vid], allVerticies[vid + 1], allVerticies[vid + 2])
        let v1 = vec3.fromValues(allVerticies[vid + 3], allVerticies[vid + 4], allVerticies[vid + 5])
        let v2 = vec3.fromValues(allVerticies[vid + 6], allVerticies[vid + 7], allVerticies[vid + 8])

        let uv0 = vec2.fromValues(allTextureVerticies[uvid], allTextureVerticies[uvid + 1])
        let uv1 = vec2.fromValues(allTextureVerticies[uvid + 2], allTextureVerticies[uvid + 3])
        let uv2 = vec2.fromValues(allTextureVerticies[uvid + 4], allTextureVerticies[uvid + 5])

        let deltaPos1 = vec3.sub(vec3.create(), v1, v0)
        let deltaPos2 = vec3.sub(vec3.create(), v2, v0)

        let deltaUV1 = vec2.sub(vec2.create(), uv1, uv0)
        let deltaUV2 = vec2.sub(vec2.create(), uv2, uv0)

        let r = 1.0 / ((deltaUV1[0] * deltaUV2[1]) - (deltaUV1[1] * deltaUV2[0]))
        let tangent = vec3.scale(vec3.create(), vec3.sub(vec3.create(), vec3.scale(vec3.create(), deltaPos1, deltaUV2[1]), vec3.scale(vec3.create(), deltaPos2, deltaUV1[1])), r)
        let bitangent = vec3.scale(vec3.create(), vec3.sub(vec3.create(), vec3.scale(vec3.create(), deltaPos2, deltaUV1[0]), vec3.scale(vec3.create(), deltaPos1, deltaUV2[0])), r)

        vertexTangents.push(tangent[0], tangent[1], tangent[2])
        vertexTangents.push(tangent[0], tangent[1], tangent[2])
        vertexTangents.push(tangent[0], tangent[1], tangent[2])
        vertexBitangents.push(bitangent[0], bitangent[1], bitangent[2])
        vertexBitangents.push(bitangent[0], bitangent[1], bitangent[2])
        vertexBitangents.push(bitangent[0], bitangent[1], bitangent[2])
    }

    let data = [ ]
    for (let i = 0; i < allVerticies.length; i += 3)
    {
        const temp = (i/3) * 2


        data.push(allVerticies[i], allVerticies[i + 1], allVerticies[i + 2])
        data.push(allColors[i], allColors[i + 1], allColors[i + 2])
        data.push(allNormals[i], allNormals[i + 1], allNormals[i + 2])
        data.push(vertexTangents[i], vertexTangents[i + 1], vertexTangents[i + 2])
        data.push(vertexBitangents[i], vertexBitangents[i + 1], vertexBitangents[i + 2])
        data.push(allTextureVerticies[temp], allTextureVerticies[temp + 1])
    }



/*
    let data = [ ]
    for ( let i = 0; i < vertex_ids.length; i++ )
    {

        const vid = ( vertex_ids[ i ] * 3 )
        const tex = ( texture_ids[ i ] * 2 )
        const nid = ( normal_ids[ i ] * 3 )

        data.push( vertices[ vid ], vertices[ vid + 1 ], vertices[ vid + 2 ] )
        data.push( colors[ vid ], colors[ vid + 1 ], colors[ vid + 2 ] )
        //vertexNormals new has normals for each vertex instead of its own list of normals
        data.push( vertexNormals[ vid ], vertexNormals[ vid + 1 ], vertexNormals[ vid + 2 ] )
        //data.push( normals[ nid ], normals[ nid + 1 ], normals[ nid + 2 ] )
        data.push( vertexTangents[ vid ], vertexTangents[ vid + 1 ], vertexTangents[ vid + 2 ] )
        data.push( vertexBitangents[ vid ], vertexBitangents[ vid + 1 ], vertexBitangents[ vid + 2 ] )


        data.push( textureVerticies[ tex ], textureVerticies[ tex + 1 ] )

    }
    */

    return data

}

function loadMatFile( object )
{
    let Ns
    let Ka = []
    let Kd = []
    let Ks = []

    let raw = loadExternalFile(object)
    let mtlRaw
    for ( let line of raw.split('\n'))
    {
        if (line.split(' ')[0] == 'mtllib')
        {
            mtlRaw = loadExternalFile(  object.substring(0, object.lastIndexOf('/') + 1) + line.split(' ')[1])
        }
    }

    //Default mtl
    if (mtlRaw == null)
    {
        return [50, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8]
    }
    for ( let line of mtlRaw.split('\n'))
    {
        let splitLine = line.split( ' ' )
        switch ( splitLine[ 0 ] )
        {
            case 'Ns':
                Ns = parseFloat(splitLine[1])
                break
            case 'Ka':
                Ka.push( parseFloat(splitLine[1]), parseFloat(splitLine[2]), parseFloat(splitLine[3]))
                break
            case 'Kd':
                Kd.push( parseFloat(splitLine[1]), parseFloat(splitLine[2]), parseFloat(splitLine[3]))
                break
            case 'Ks':
                Ks.push( parseFloat(splitLine[1]), parseFloat(splitLine[2]), parseFloat(splitLine[3]))
                break
        }
    }
    let returnArray = [Ns, Ka[0], Ka[1], Ka[2], Kd[0], Kd[1], Kd[2], Ks[0], Ks[1], Ks[2]]
    return returnArray
}


/**
 * Parses a given object vertex entry line
 * @param { String } entry A line of an object vertex entry
 * @param { Array.<Number> } list The list to write the parsed vertex coordinates to
 */
function parseObjVertex( entry, list )
{

    const elements = entry.split( ' ' )
    if ( elements.length < 4 )
        alert( "Unknown vertex entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( elements[ 2 ] ), parseFloat( elements[ 3 ] ) )

}

/**
 * Parses a given object color entry line
 * @param { String } entry A line of an object color entry
 * @param { Array.<Number> } list The list to write the parsed vertex colors to
 * @param { Array.<Number> } fallback_color A fallback color in case the OBJ does not define vertex colors
 */
function parseObjColor( entry, list, fallback_color )
{

    const elements = entry.split( ' ' )
    if ( elements.length < 7 )
    {

        list.push( fallback_color[ 0 ], fallback_color[ 1 ], fallback_color[ 2 ] )
        return

    }

    list.push( parseFloat( elements[ 4 ] ), parseFloat( elements[ 5 ] ), parseFloat( elements[ 6 ] ) )

}

/**
 * Parses a given object normal entry line
 * @param { String } entry A line of an object normal entry
 * @param { Array.<Number> } list The list to write the parsed vertex normals to
 */
function parseObjNormal( entry, list )
{

    const elements = entry.split( ' ' )
    if ( elements.length != 4 )
        alert( "Unknown normals entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( elements[ 2 ] ), parseFloat( elements[ 3 ] ) )

}

function parseObjTextureVerticies( entry, list )
{

    const elements = entry.split( ' ' )
    if ( elements.length != 3 )
        alert( "Unknown texture vertex entry " + entry )

    list.push( parseFloat( elements[ 1 ] ), parseFloat( -elements[ 2 ] ), )

}

/**
 * Parses a given object ids entry line
 * @param { String } entry A line of an object ids entry
 * @param { Array.<Number> } vertex_ids The list of vertex ids to write to
 * @param { Array.<Number> } normal_ids The list normal ids to write to
 */
function parseObjIds( entry, vertex_ids, normal_ids, texture_ids )
{

    const elements = entry.split( ' ' )
    if ( elements.length != 4 )
        alert( "Unknown face entry " + entry )

    for ( let element of elements )
    {

        if ( element == 'f' )
            continue

        const subelements = element.split( '/' )

        vertex_ids.push( parseInt( subelements[ 0 ] ) - 1 )
        normal_ids.push( parseInt( subelements[ 2 ] ) - 1 )
        texture_ids.push( parseInt( subelements[ 1 ] ) - 1 )

    }

}

/**
 * Loads a scene file and triggers the appropriate parsing functions
 * @param { String } url The url to the scene file
 * @returns An object containing information about the camera, the light and the scene
 */
function loadSceneFile( url )
{

    let raw = loadExternalFile( url )

    let scene_description = JSON.parse( raw )

    return {

        "camera": parseCamera( scene_description[ "camera" ] ),
        "scene": parseSceneNode( scene_description[ "root" ], null )

    }
}

/**
 * Parses a given camera entry
 * @param { TODO } entry An entry containing information on a single camera
 * @returns A camera instance with the camera read from the scene file
 */
function parseCamera( entry )
{

    let camera = null

    let position = vec3.fromValues( entry.position[ 0 ], entry.position[ 1 ], entry.position[ 2 ] )
    let lookat = vec3.fromValues( entry.lookat[ 0 ], entry.lookat[ 1 ], entry.lookat[ 2 ] )
    let up = vec3.fromValues( entry.up[ 0 ], entry.up[ 1 ], entry.up[ 2 ] )
    let fov = entry.fov

    if ( entry.type == "perspective" )
    {

        camera = new PerspectiveCamera( position, lookat, up, fov )

    }
    else if ( entry.type == "orthographic" )
    {

        camera = new OrthographicCamera( position, lookat, up, fov )

    }

    return camera

}




/**
 *  Recursively parses a SceneNode and its children
 * @param { Object } entry An entry from the JSON config representing a SceneNode
 * @param { Object | null } parent The parent node of the current SceneNode
 * @returns { SceneNode } The parsed SceneNode object
 */
function parseSceneNode( entry, parent )
{

    let node = null

    let name = entry.name
    let translation = vec3.fromValues( entry.translation[ 0 ], entry.translation[ 1 ], entry.translation[ 2 ] )
    let rotation = vec3.fromValues( entry.rotation[ 0 ], entry.rotation[ 1 ], entry.rotation[ 2 ] )
    let scale = vec3.fromValues( entry.scale[ 0 ], entry.scale[ 1 ], entry.scale[ 2 ] )

    if ( entry.type == 'node' )
    {
        node = new SceneNode( name, parent, translation, rotation, scale )

    }
    else if ( entry.type == 'object' )
    {

        const fallback_color = hex2rgb( entry.color )
        const obj_content = loadObjFile( entry.obj, fallback_color )
        const mat_properties = loadMatFile( entry.obj )

        node = new ObjectNode( obj_content, name, parent, translation, rotation, scale, mat_properties, entry.texture, entry.normal )

    }
    else if ( entry.type == 'pointLight' )
    {
        const color = hex2rgb(entry.color)

        node = new PointLight( name, parent, translation, color, parseFloat(entry.power) )
    }
    else if ( entry.type == 'directionalLight' )
    {
        const color = hex2rgb(entry.color)
        const direction = vec3.fromValues( entry.direction[0], entry.direction[1], entry.direction[2])

        node = new DirectionalLight( name, parent, direction, color, parseFloat(entry.power) )
    }

    for ( let child of entry.children )
        node.children.push( parseSceneNode( child, node ) )

    return node

}

export
{

    clamp,
    deg2rad,
    hex2rgb,
    getRelativeMousePosition,
    loadExternalFile,
    loadObjFile,
    loadSceneFile

}
