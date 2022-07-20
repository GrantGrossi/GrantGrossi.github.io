'use strict'

import SceneNode from "./scenenode.js";

class PointLight extends SceneNode
{
    constructor(name, parent, translation = vec3.create(), color, power)
    {
        super(name, parent, translation)

        this.type = "pointLight"
        this.color = color
        this.power = power

    }
}

class DirectionalLight extends SceneNode
{
    constructor(name, parent, direction = vec3.create(), color, power)
    {
        super(name, parent)
        
        this.type = "directionalLight"
        this.direction = direction
        this.color = color
        this.power = power
    }
}

export
{
    PointLight,
    DirectionalLight
}