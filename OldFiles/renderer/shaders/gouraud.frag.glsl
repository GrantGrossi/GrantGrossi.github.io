#version 300 es
precision mediump float;

// Passed in from the vertex shader
in vec3 v_illumination;
in highp vec2 v_uv;

uniform sampler2D uSampler;

// Final color
out vec4 out_color;

void main() {
    out_color = vec4(texture(uSampler, v_uv).xyz * v_illumination, 1.0);
}
