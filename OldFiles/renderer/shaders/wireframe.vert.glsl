#version 300 es
in vec3 a_position;

uniform mat4 u_mvp_matrix;

out vec3 v_barycentric;

void main() {
    
    // Multiply the position by the matrix.
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);

    if (gl_VertexID % 3 == 0) {
        v_barycentric = vec3(1,0,0);
    } else if (gl_VertexID % 3 == 1) {
        v_barycentric = vec3(0,1,0);
    } else if (gl_VertexID % 3 == 2) {
        v_barycentric = vec3(0,0,1);
    }

}
