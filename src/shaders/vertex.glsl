uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;


void main(){

    vUv = uv;
    vPosition = position;

   // vPosition.x = vPosition.x +sin(vPosition.x *uTime *0.5);
    //vPosition.y = vPosition.y +cos(vPosition.y *uTime *0.5);

    vec4 modelPosition = modelMatrix * vec4(vPosition, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition ;

}