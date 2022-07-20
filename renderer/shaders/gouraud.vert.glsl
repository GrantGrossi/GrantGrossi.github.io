#version 300 es

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec2 a_uv;


uniform mat4 u_mvp_matrix;
uniform mat4 u_m_matrix;
uniform vec3 viewPos;
uniform float worldScale;

uniform float ns;
uniform vec3 ka;
uniform vec3 kd;
uniform vec3 ks;

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

uniform PointLight pointLights[10];
uniform DirectionalLight directionalLights[10];

uniform int numPointLights;
uniform int numDirLights;


out vec3 v_illumination;
out highp vec2 v_uv;


float falloff(float);

void main() {

    //Get the world position of the vector
    vec4 worldPosVec4 = u_m_matrix * vec4(a_position, 1.0);

    //Convert the vec4 to a vec3
    vec3 worldPos = vec3(worldPosVec4.x, worldPosVec4.y, worldPosVec4.z);

    //Matrix used to convert normal to world space
    mat4 normalMatrix = transpose(inverse(u_m_matrix));

    //Convert normal to world space
    vec4 worldNormalVec4 = normalMatrix * vec4(a_normal, 1.0);

    //The vertex normal in world Space
    vec3 N = normalize(vec3(worldNormalVec4.x, worldNormalVec4.y, worldNormalVec4.z));

    //The vector pointing at the view
    vec3 V = normalize(worldPos - viewPos);

    //This should just be ka when colors get added to the scene file
    vec3 I = ka;


    int NUM_POINT_LIGHTS = numPointLights;
    int NUM_DIR_LIGHTS = numDirLights;
    for (int i = 0; i < NUM_POINT_LIGHTS; i++)
    {
        //The vector pointing at the light
        vec3 L = normalize(pointLights[i].location - worldPos);

        //The mirrored direction of L about N
        vec3 R = reflect(L, N);

        float distance = distance(worldPos, pointLights[i].location);

        vec3 diffuse = kd * max(dot(N, L), 0.0);
        vec3 specular = ks * (pow(max(dot(R, V), 0.0), ns));

        I = I + falloff(distance) * pointLights[i].color * pointLights[i].power * (diffuse + specular);
    }

    for (int i = 0; i < NUM_DIR_LIGHTS; i++)
    {

        //directionalLights[i]

        //Inverse direction of the light direction
        vec3 L = normalize(directionalLights[i].direction * -1.0);

        //The mirrored direction of L about N
        vec3 R = reflect(L, N);


        vec3 diffuse = kd * max(dot(N, L), 0.0);
        vec3 specular = ks * (pow(max(dot(R, V), 0.0), ns));

        I = I + directionalLights[i].color * directionalLights[i].power * (diffuse + specular);
    }


    //v_color = a_color * I;
    v_illumination = I;

    v_uv = a_uv;

    // Multiply the position by the matrix
    gl_Position = u_mvp_matrix * vec4(a_position, 1.0);
}

float falloff(float distance)
{
    float inversScale = pow(worldScale, -1.0);
    return min(1.0, pow(1.0 + distance * inversScale + (distance*distance*inversScale*inversScale), -1.0));
}