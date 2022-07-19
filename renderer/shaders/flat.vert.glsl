#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec2 a_uv;

uniform mat4 u_mvp_matrix;

out vec3 v_color;
out highp vec2 v_uv;

void main() {

    v_color = a_color;
    v_uv = a_uv;

    // Multiply the position by the matrix.
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}