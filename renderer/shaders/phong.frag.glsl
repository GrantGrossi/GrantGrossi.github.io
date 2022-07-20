#version 300 es
precision mediump float;


in vec3 v_position;
in vec3 v_normal;
in mat3 vTBN;
in highp vec2 v_uv;

uniform sampler2D uSampler;
uniform sampler2D normalMap;

uniform mat4 u_m_matrix_frag;
uniform vec3 viewPos;
uniform float worldScale;

struct PointLight
{
    vec3 location;
    vec3 color;
    float power;
};
struct DirectionalLight
{
    vec3 direction;
    vec3 color;
    float power;
};

uniform float ns;
uniform vec3 ka;
uniform vec3 kd;
uniform vec3 ks;

uniform PointLight pointLights[10];
uniform DirectionalLight directionalLights[10];

uniform int numPointLights;
uniform int numDirLights;

// Final color
out vec4 out_color;

float falloff (float);

void main() {


    vec4 worldPosVec4 = u_m_matrix_frag * vec4(v_position, 1.0);

    //Convert the vec4 to a vec3
    vec3 worldPos = vec3(worldPosVec4.x, worldPosVec4.y, worldPosVec4.z);
    

    


    vec3 normal = texture(normalMap, v_uv).rgb;
    //normal = normalize(normal);


    normal = normal * 2.0 - 1.0;

    normal = normalize(vTBN * normal);




    //Matrix used to convert normal to world space
    mat4 normalMatrix = transpose(inverse(u_m_matrix_frag));

    //Convert normal to world space
    //vec4 worldNormalVec4 = normalMatrix * vec4(v_normal, 1.0);

    //The vertex normal in world Space
    //vec3 N = normalize(vec3(worldNormalVec4.x, worldNormalVec4.y, worldNormalVec4.z));

    vec3 V = normalize(worldPos - viewPos);


    vec3 I = ka;


    int NUM_POINT_LIGHTS = numPointLights;
    int NUM_DIR_LIGHTS = numDirLights;

    for (int i = 0; i < NUM_POINT_LIGHTS; i++)
    {
        //The vector pointing at the light
        vec3 L = normalize(pointLights[i].location - worldPos);

        //The mirrored direction of L about normal
        vec3 R = reflect(L, normal);

        float distance = distance(worldPos, pointLights[i].location);

        vec3 diffuse = kd * max(dot(normal, L), 0.0);
        vec3 specular = ks * (pow(max(dot(R, V), 0.0), ns));

        I = I + falloff(distance) * pointLights[i].color * pointLights[i].power * (diffuse + specular);
    }

    for (int i = 0; i < NUM_DIR_LIGHTS; i++)
    {

        //Inverse direction of the light direction
        vec3 L = normalize(directionalLights[i].direction * -1.0);

        //The mirrored direction of L about normal
        vec3 R = reflect(L, normal);

        vec3 diffuse = kd * max(dot(normal, L), 0.0);
        vec3 specular = ks * (pow(max(dot(R, V), 0.0), ns));

        I = I + directionalLights[i].color * directionalLights[i].power * (diffuse + specular);
    }




    out_color = vec4(texture(uSampler, v_uv).xyz * I, 1.0);
}

float falloff(float distance)
{
    float inversScale = pow(worldScale, -1.0);
    return min(1.0, pow(1.0 + distance * inversScale + (distance*distance*inversScale*inversScale), -1.0));
}