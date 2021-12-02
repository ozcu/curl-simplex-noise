import './styles/main.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

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

console.log(renderer.info)



//Gui
const gui = new GUI()
gui.close()


const settings = {
    progress:1.0,
    scale:1.0,
    vectorScale:0.1,
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
                scene.remove(obj); 
            }
            
        }
    }    

    
   /*  scene.traverse((child)=>{
            //Check if there is a mesh
            if(child instanceof THREE.Mesh){
                console.log(child.geometry)
                child.geometry.dispose()
                //Loop through the material properties
                for(const key in child.material){
                    const value = child.material[key]
                    //Test if there is a dispose function
                    if(value && typeof value.dispose ==='function'){
                        console.log(child.material)
                        value.dispose()
                    }
                }
                console.log(child)
                scene.remove(child)
            }
        }) */
    

    //Tube Methods
    let getCurve = (start)=>{

        points = []
        
        points.push(start)
        let currentPoint = start.clone()

        for(let i = 0 ; i<500;i++){

            v = curlNoise(currentPoint.x,currentPoint.y,currentPoint.z)
            
            currentPoint.addScaledVector(v,settings.vectorScale)
            //console.log(currentPoint,v)
            points.push(currentPoint.clone())
           
        }
        return points
    }

    for(let i =0; i<500;i++){
        path = new CatmullRomCurve3(
            getCurve(new THREE.Vector3(Math.sin(i),Math.cos(i),0))
            
        )
        
        geometry = new THREE.TubeGeometry( path, 80, 0.001, 8, false )
        
        curve = new THREE.Mesh(geometry,shaderMaterial)
        
        scene.add(curve)

    }


}

generateCurve()




//Gui init
gui.add(settings,'progress',0,1,0.01)
gui.add(settings,'scale',0,10,1).onFinishChange(generateCurve())

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
    /*
    console.log(elapsedTime)

     if(elapsedTime > 4.0 && elapsedTime <4.05){
        console.log('fired')
       generateCurve()
    } */
    
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