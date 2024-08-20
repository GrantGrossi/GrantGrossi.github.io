#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec2 a_uv;
in vec3 a_tangent;
in vec3 a_bitangent;

uniform mat4 u_mvp_matrix;
uniform mat4 u_m_matrix;

out vec3 v_position;
out vec3 v_color;
out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;
out highp vec2 v_uv;
out mat3 vTBN;

void main() {

    
    v_position = a_position;
    v_color = a_color;
    v_normal = a_normal;
    v_tangent = a_tangent;
    v_bitangent = a_bitangent;
    v_uv = a_uv;

    vec3 T = normalize(vec3(u_m_matrix * vec4(a_tangent, 0.0)));
    vec3 B = normalize(vec3(u_m_matrix * vec4(a_bitangent, 0.0)));
    vec3 N = normalize(vec3(u_m_matrix * vec4(a_normal, 0.0)));
    vTBN = mat3(T,B,N);
    

    // Multiply the position by the matrix.
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}