#version 300 es
precision mediump float;

// Passed in from the vertex shader
in vec3 v_color;
in highp vec2 v_uv;

uniform sampler2D uSampler;

// Final color
out vec4 out_color;

void main() {
    //out_color = vec4(v_color, 1.0);
    out_color = vec4(texture(uSampler, v_uv).xyz, 1.0);
}
