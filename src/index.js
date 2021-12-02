import './styles/main.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import boilerVertexShader from './shaders/vertex.glsl'
import boilerFragmentShader from './shaders/fragment.glsl'
import { CatmullRomCurve3 } from 'three'
import GUI from 'lil-gui'


/**Simplex Noise Curl ***/

import SimplexNoise from 'simplex-noise';
const simplex = new SimplexNoise();

module.exports = curlNoise;
function curlNoise (x, y, z, curl = new THREE.Vector3()) {
  const eps = 1.0;
  let n1, n2, a, b;

  //Find the rate of change in YZ plane
  n1 = simplex.noise3D(x, y + eps, z);
  n2 = simplex.noise3D(x, y - eps, z);
  a = (n1 - n2) / (2 * eps);
  n1 = simplex.noise3D(x, y, z + eps);
  n2 = simplex.noise3D(x, y, z - eps);
  b = (n1 - n2) / (2 * eps);

  curl.x = a - b;
 
  //Find the rate of change in XZ plane
  n1 = simplex.noise3D(x, y, z + eps);
  n2 = simplex.noise3D(x, y, z - eps);
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise3D(x + eps, y, z);
  n2 = simplex.noise3D(x + eps, y, z);
  b = (n1 - n2)/(2 * eps);

  curl.y = a - b;

  //Find the rate of change in XY plane
  n1 = simplex.noise3D(x + eps, y, z);
  n2 = simplex.noise3D(x - eps, y, z);
  a = (n1 - n2)/(2 * eps);
  n1 = simplex.noise3D(x, y + eps, z);
  n2 = simplex.noise3D(x, y - eps, z);
  b = (n1 - n2)/(2 * eps);

  curl.z = a - b;

  return curl;
};


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(1.0,1.0,1.0)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 5
camera.position.z = 5
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


/**
 * Renderer
 */
 const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//console.log(renderer.info)


//Gui
const gui = new GUI()
gui.close()


const settings = {
    lengthOfCurve:50,
    numberOfCurve:400,
    noiseScale:0.5,
    noiseLengthScale:0.1,

}



/**
 * Tube
 */



let shaderMaterial = null


shaderMaterial= new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    vertexShader:boilerVertexShader,
    fragmentShader:boilerFragmentShader,
    uniforms:{
        uTime:{value:0}
    }


})


let points = null
let v = null
let path = null
let geometry = null
let curve = null



const generateCurve = ()=>{
 
    if(scene.children.length !== null){
        for( let i = scene.children.length - 1; i >= 0; i--) { 
            
            let obj = scene.children[i];
            if(obj instanceof THREE.Mesh){
                obj.geometry.dispose()
                obj.material.dispose()
                scene.remove(obj); 
            }
            
        }
    }    
    

    //Tube Methods
    let getCurve = (start)=>{

        points = []
        
        points.push(start)
        let currentPoint = start.clone()

        for(let i = 0 ; i<settings.lengthOfCurve;i++){

            v = curlNoise(currentPoint.x/settings.noiseScale,currentPoint.y/settings.noiseScale,currentPoint.z/settings.noiseScale)
            
            currentPoint.addScaledVector(v,settings.noiseLengthScale)
            //console.log(currentPoint,v)
            points.push(currentPoint.clone())
           
        }
        return points
    }
    const geometries = []
    for(let i =0; i<settings.numberOfCurve;i++){
        path = new CatmullRomCurve3(
            getCurve(new THREE.Vector3(Math.sin(i),Math.cos(i),0))
            
        )
        
        geometry = new THREE.TubeGeometry( path, settings.numberOfCurve, 0.001, 8, false )
        
        
        
       // scene.add(curve)
       geometries.push(geometry)

    }
    const mergedGeometry = mergeBufferGeometries(geometries)
    curve = new THREE.Mesh(mergedGeometry,shaderMaterial)
    scene.add(curve) 

}

generateCurve()


//Gui init
gui.add(settings,'numberOfCurve',200,600,50).onFinishChange(()=>{
    generateCurve()

})
gui.add(settings,'lengthOfCurve',50,600,1).onFinishChange(()=>{
    generateCurve()

})
gui.add(settings,'noiseScale',0.01,2.0,0.1).onFinishChange(()=>{
    generateCurve()

})
gui.add(settings,'noiseLengthScale',0.01,0.5,0.01).onFinishChange(()=>{
    generateCurve()

})


/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const animateScene = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime
    
    //Update shader with time
    shaderMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call animateScene again on the next frame
    window.requestAnimationFrame(animateScene)
}

animateScene()