'use strict'

import SceneNode from "./scenenode.js";

class ObjectNode extends SceneNode
{

    constructor( vbo_data, name, parent, translation = vec3.create( ), rotation = vec3.create( ), scale = vec3.fromValues( 1, 1, 1 ), material_properties, imageLocation, normalLocation )
    {

        super( name, parent, translation, rotation, scale )

        this.type = "object"
        this.vbo_data = new Float32Array( vbo_data )
        this.vbo = null
        this.mat_data = material_properties
        this.ns = material_properties[0]
        this.ka = vec3.fromValues(material_properties[1], material_properties[2], material_properties[3])
        this.kd = vec3.fromValues(material_properties[4], material_properties[5], material_properties[6])
        this.ks = vec3.fromValues(material_properties[7], material_properties[8], material_properties[9])
        this.imageLocation = imageLocation
        this.normalLocation = normalLocation
        this.texture = null
        this.normalMap = null

    }

    update( )
    {

        super.update( )

    }

    getWorldSpaceTriangles() {
        let triangles = []

        for(let i = 0; i < this.vbo_data.length; i += 27) {
            let offset = 0
            let triangle = []
            for (let j = 0; j < 3; j++) {
                offset = j*9
                let v = vec3.fromValues(this.vbo_data[offset + i], this.vbo_data[offset + i+1], this.vbo_data[offset + i+2])
                v = vec3.transformMat4(v, v, this.getTransform())
                triangle.push(v)
            }

            triangles.push(triangle)
        }

        return triangles
    }

    loadTexture(gl, url)
    {
        // From: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // Because images have to be downloaded over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        const level = 0
        const internalFormat = gl.RGBA
        const width = 1
        const height = 1
        const border = 0
        const srcFormat = gl.RGBA
        const srcType = gl.UNSIGNED_BYTE
        const pixel = new Uint8Array([255, 0, 190, 255])     // bright pink
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        width, height, border, srcFormat, srcType,
                        pixel)

        
        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);
        
            // WebGL1 has different requirements for power of 2 images
            // vs non power of 2 images so check if the image is a
            // power of 2 in both dimensions.
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn off mips and set
                // wrapping to clamp to edge
                /*

                //This didn't seem to work but just generating mips seems to work fine

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                */
                gl.generateMipmap(gl.TEXTURE_2D);

            }
        };
        image.src = url;
        
        return texture;
    }

    loadNormal(gl, url)
    {
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)

        // Same as the texture
        // If there is normal texture the light blue
        // pixel will act as the normal map
        const level = 0
        const internalFormat = gl.RGBA
        const width = 1
        const height = 1
        const border = 0
        const srcFormat = gl.RGBA
        const srcType = gl.UNSIGNED_BYTE
        const pixel = new Uint8Array([127, 127, 255, 255])     // normal blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        width, height, border, srcFormat, srcType,
                        pixel)

        
        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);
        
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        if (url != undefined)
        {
            image.src = url;
        }
        
        return texture;
    }

    

    createBuffers( gl )
    {
        this.vbo = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vbo )
        gl.bufferData( gl.ARRAY_BUFFER, this.vbo_data, gl.STATIC_DRAW )

        
        this.texture = this.loadTexture(gl, this.imageLocation)
        this.normalMap = this.loadNormal(gl, this.normalLocation)
        
        //Send texture to the shader
        /*this.texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 255, 255, 255]));

        if (this.imageLocation !== undefined)
        {
            let image = new Image()
            image.src = this.imageLocation
            
            image.addEventListener('load', function() {
                gl.bindTexture(gl.TEXTURE_2D, this.texture)
                //gl.texImage2D()
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);
            })
        }
        console.log(this.imageLocation)*/
        
    }

    render( gl, shader, useBilinear )
    {
        shader.setUniform1f("ns", this.ns)
        shader.setUniform3f("ka", this.ka)
        shader.setUniform3f("kd", this.kd)
        shader.setUniform3f("ks", this.ks)


        if ( this.vbo == null )
            this.createBuffers( gl )


        if (useBilinear == true)
        {
            gl.activeTexture(gl.TEXTURE0)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.activeTexture(gl.TEXTURE1)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        else
        {
            gl.activeTexture(gl.TEXTURE0)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.activeTexture(gl.TEXTURE1)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);



        //Use the first image
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.uniform1i(shader.getUniformLocation("uSampler"), 0)

        //Use the second image
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap)
        gl.uniform1i(shader.getUniformLocation("normalMap"), 1)

        let stride = (3 * 5 + 2) * 4,
            offset = 0
        let attrib_loc;
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vbo )
        attrib_loc = shader.getAttributeLocation( "a_position" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_position" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_position" ) )
        }

        offset = 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_color" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_color" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_color" ) )
        }

        offset = 2 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_normal" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_normal" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_normal" ) )
        }

        offset = 3 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_tangent" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_tangent" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_tangent" ) )
        }

        offset = 4 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_bitangent" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_bitangent" ), 3, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_bitangent" ) )
        }

        offset = 5 * 3 * 4
        attrib_loc = shader.getAttributeLocation( "a_uv" )
        if (attrib_loc >= 0) {
            gl.vertexAttribPointer( shader.getAttributeLocation( "a_uv" ), 2, gl.FLOAT, false, stride, offset )
            gl.enableVertexAttribArray( shader.getAttributeLocation( "a_uv" ) )
        }

        gl.drawArrays( gl.TRIANGLES, 0, this.vbo_data.length / 17 )

    }
}

function isPowerOf2(value)
    {
        return (value & (value - 1)) == 0
    }

export default ObjectNode
