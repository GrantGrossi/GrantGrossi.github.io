'use strict'

import Input from "./input.js"
import {PerspectiveCamera, OrthographicCamera} from "./camera.js"
import {OrbitMovement, RaycastMovement} from './movement.js'

class AppState
{

    constructor( app )
    {

        this.app = app
        this.is_selecting = false
        this.selectedLight = 0;
        this.materialFieldPopulated = false;
        this.shaderLocked = true;
        this.useBilinear = true;

        // get list of ui indicators
        this.ui_categories = {

            "camera_mode":
            {

                "fps": document.getElementById( "fpsCamMode" ),
                "stationary": document.getElementById( "statCamMode" )

            },
            "projection_mode":
            {

                "perspective": document.getElementById( "perspProjMode" ),
                "orthographic": document.getElementById( "orthoProjMode" )

            },
            "selection":
            {

                "raycasting": document.getElementById( "selectionRaycasting" ),
                "target": document.getElementById( "selectionTarget" )

            },
            "shading":
            {

                "wireframe": document.getElementById( "wireframeShading" ),
                "flat": document.getElementById( "flatShading" ),
                "gouraud": document.getElementById( "gouraudShading" ),
                "phong": document.getElementById( "phongShading" ),
            },
            "lights":
            {
                "pointLight1": document.getElementById( "pointLight1"),
                "pointLight2": document.getElementById( "pointLight2"),
                "dirLight": document.getElementById( "directionalLight")
            },
            "lightProperties":
            {
                "lightX": document.getElementById( "lightX" ),
                "lightY": document.getElementById( "lightY" ),
                "lightZ": document.getElementById( "lightZ" ),
                "lightR": document.getElementById( "lightR" ),
                "lightG": document.getElementById( "lightG" ),
                "lightB": document.getElementById( "lightB" ),
                "color": document.getElementById( "color" ),
                "intensity": document.getElementById( "LightIntensity" )
            },
            "materialProperties":
            {
                "Ns": document.getElementById( "Ns" ),
                "Ka1": document.getElementById( "Ka1" ),
                "Ka2": document.getElementById( "Ka2" ),
                "Ka3": document.getElementById( "Ka3" ),
                "Kd1": document.getElementById( "Kd1" ),
                "Kd2": document.getElementById( "Kd2" ),
                "Kd3": document.getElementById( "Kd3" ),
                "Ks1": document.getElementById( "Ks1" ),
                "Ks2": document.getElementById( "Ks2" ),
                "Ks3": document.getElementById( "Ks3" )
            },
            "shaderLock":
            {
                "shaderLock": document.getElementById( "shaderLock" )
            },
            "textureSampling":
            {
                "bilinear": document.getElementById( "bilinear"),
                "nearest": document.getElementById( "nearest")
            }

        }

        // update ui with default values
        this.updateUI( "camera_mode", "stationary" )
        this.updateUI( "shading", "flat" )
        this.updateUI( "projection_mode", "perspective" )
        this.updateUI( "selection", "target" )
        this.updateUI( "lights", "pointLight1" )

        this.populateLightFields()

    }

    /**
     * Updates the app state by checking the input module for changes in user input
     */
    update( )
    {
        // Light Input
        if ( Input.isKeyPressed("l") ) {
            this.selectedLight = (this.selectedLight + 1) % 3
            if (this.selectedLight == 0)
            {
                this.updateUI("lights", "pointLight1")
                this.populateLightFields()
            }
            else if (this.selectedLight == 1)
            {
                this.updateUI("lights", "pointLight2")
                this.populateLightFields()
            }
            else 
            {
                this.updateUI("lights", "dirLight")
                this.populateLightFields()
            }
        }

        this.updateLight()

        if (Input.isKeyPressed("s"))
        {
            this.ui_categories["shaderLock"]["shaderLock"].classList.remove( this.shaderLocked ? "inactive" : "active" )
            this.ui_categories["shaderLock"]["shaderLock"].classList.add( !this.shaderLocked ? "inactive" : "active" )
            this.shaderLocked = !this.shaderLocked
        }

        if (this.shaderLocked)
        {
            // Shading Input
            if ( Input.isKeyDown( "1" ) ) {
                this.app.shader = this.app.wireframe_shader
                this.updateUI("shading", "wireframe")
            } else if ( Input.isKeyDown( "2" ) ) {
                this.app.shader = this.app.flat_shader
                this.updateUI("shading", "flat")
            } else if ( Input.isKeyDown( "3" ) ) {
                this.app.shader = this.app.gouraud_shader
                this.updateUI("shading", "gouraud")
            } else if ( Input.isKeyDown( "4" ) ) {
                this.app.shader = this.app.phong_shader
                this.updateUI("shading", "phong")
            }
        }

        if (this.ui_categories["textureSampling"]["bilinear"].checked)
        {
            this.useBilinear = true
        }
        else
        {
            this.useBilinear = false
        }
        
        
        // Camera Input
        if ( Input.isKeyDown( "o" ) ) {
            this.app.camera = new OrthographicCamera(this.app.camera.position, this.app.camera.look_at, this.app.camera.up, this.app.camera.fovy, this.app.camera.aspect, this.app.camera.near, this.app.camera.far)
            this.app.movement.camera = this.app.camera
            this.app.initCamera()
            this.updateUI("projection_mode", "orthographic")
        } else if ( Input.isKeyDown( "p" ) ) {
            this.app.camera = new PerspectiveCamera(this.app.camera.position, this.app.camera.look_at, this.app.camera.up, this.app.camera.fovy, this.app.camera.aspect, this.app.camera.near, this.app.camera.far)
            this.app.movement.camera = this.app.camera
            this.app.initCamera()
            this.updateUI("projection_mode", "perspective")
        }

        // Raycasting
        if ( Input.isKeyPressed( "r" ) && !this.is_selecting) {
            console.log("Raycast on")
            this.app.movement = new RaycastMovement(this.app)
            this.updateUI("selection", "raycasting")
            this.is_selecting = true
        } else if (Input.isKeyPressed( "r" ) && this.is_selecting) {
            this.app.movement = new OrbitMovement(this.app)
            this.updateUI("selection", "target", "No Target Selected")
            this.is_selecting = false
        }

        if (this.is_selecting && this.app.movement.selected_object)
        {
            this.updateUI("selection", "target", "Selected '"+this.app.movement.selected_object.name+"'")
            if (this.materialFieldPopulated == false)
            {
                this.populateMaterialField(this.app.movement.selected_object)
                this.materialFieldPopulated = true
            }
            this.updateMaterial(this.app.movement.selected_object)
        }
        else
        {
            this.clearMaterialField()
            this.materialFieldPopulated = false
        }
    }

    /**
     * Updates the ui to represent the current interaction
     * @param { String } category The ui category to use; see this.ui_categories for reference
     * @param { String } name The name of the item within the category
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUI( category, name, value = null )
    {

        for ( let key in this.ui_categories[ category ] )
        {

            this.updateUIElement( this.ui_categories[ category ][ key ], key == name, value )

        }

    }

    /**
     * Updates a single ui element with given state and value
     * @param { Element } el The dom element to update
     * @param { Boolean } state The state (active / inactive) to update it to
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUIElement( el, state, value )
    {

        el.classList.remove( state ? "inactive" : "active" )
        el.classList.add( state ? "active" : "inactive" )

        if ( state && value != null )
            el.innerHTML = value

    }


    
    populateLightFields()
    {
        //This assumes only two point lights and one directional light

        if (this.selectedLight < 2)
        {
            let currentLight = this.app.pointLights[this.selectedLight]
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightX" ], currentLight.translation[0])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightY" ], currentLight.translation[1])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightZ" ], currentLight.translation[2])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightR" ], currentLight.color[0])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightG" ], currentLight.color[1])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightB" ], currentLight.color[2])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "intensity" ], currentLight.power)
        }
        else
        {
            let currentLight = this.app.directionalLights[this.selectedLight - 2]
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightX" ], currentLight.direction[0])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightY" ], currentLight.direction[1])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightZ" ], currentLight.direction[2])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightR" ], currentLight.color[0])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightG" ], currentLight.color[1])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "lightB" ], currentLight.color[2])
            this.writeNumberToField(this.ui_categories["lightProperties"][ "intensity" ], currentLight.power)
        }

        
        
    }

    


    updateLight()
    {
        if (this.selectedLight < 2)
        {
            let currentLight = this.app.pointLights[this.selectedLight]
            currentLight.translation[0] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightX" ])
            currentLight.translation[1] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightY" ])
            currentLight.translation[2] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightZ" ])
            currentLight.color[0] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightR" ])
            currentLight.color[1] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightG" ])
            currentLight.color[2] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightB" ])
            currentLight.power = this.getValueFromField(this.ui_categories["lightProperties"][ "intensity" ])
            currentLight.updateTransform()
        }
        else
        {
            let currentLight = this.app.directionalLights[this.selectedLight - 2]
            currentLight.direction[0] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightX" ])
            currentLight.direction[1] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightY" ])
            currentLight.direction[2] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightZ" ])
            currentLight.color[0] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightR" ])
            currentLight.color[1] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightG" ])
            currentLight.color[2] = this.getValueFromField(this.ui_categories["lightProperties"][ "lightB" ])
            currentLight.power = this.getValueFromField(this.ui_categories["lightProperties"][ "intensity" ])
        }
    }

    populateMaterialField(object)
    {
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ns" ], object.ns)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka1" ], object.ka[0])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka2" ], object.ka[1])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka3" ], object.ka[2])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd1" ], object.kd[0])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd2" ], object.kd[1])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd3" ], object.kd[2])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks1" ], object.ks[0])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks2" ], object.ks[1])
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks3" ], object.ks[2])
    }

    clearMaterialField()
    {
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ns" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka1" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka2" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ka3" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd1" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd2" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Kd3" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks1" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks2" ], null)
        this.writeNumberToField(this.ui_categories["materialProperties"][ "Ks3" ], null)
    }

    updateMaterial(object)
    {
        object.ns = this.getValueFromField(this.ui_categories["materialProperties"][ "Ns" ])
        object.ka[0] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ka1" ])
        object.ka[1] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ka2" ])
        object.ka[2] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ka3" ])
        object.kd[0] = this.getValueFromField(this.ui_categories["materialProperties"][ "Kd1" ])
        object.kd[1] = this.getValueFromField(this.ui_categories["materialProperties"][ "Kd2" ])
        object.kd[2] = this.getValueFromField(this.ui_categories["materialProperties"][ "Kd3" ])
        object.ks[0] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ks1" ])
        object.ks[1] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ks2" ])
        object.ks[2] = this.getValueFromField(this.ui_categories["materialProperties"][ "Ks3" ])
    }

    writeNumberToField(element, number)
    {
        element.value = number
        //element.setAttribute("value", number)
    }

    /**
     * @param { Element } element The dom element to update
     */
    getValueFromField(element)
    {
        //console.log(element.value)
        return element.value
    }

    

}

export default AppState
