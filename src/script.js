import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 384
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Galaxy
const parameters = {};
parameters.count = 100000;
parameters.size = .01;
parameters.radius = 5
parameters.branches = 3
parameters.spin = 1
parameters.distributionOffset = .15
parameters.randomnessPower = 3
parameters.distributeStarsUniformly = false
const powerStep = .1
const minPower = 1
const maxPower = 10
parameters.insideColor = 0xff6030
parameters.outsideColor = 0x1b3984

// Powers LUT
let powers;
function generatePowers ()
{
    const t = performance.now()
    powers = new Float32Array(parameters.count);
    let i
    for (i = 0; i < parameters.count; i ++)
    {
        // powers[ i ] = Math.expm1(Math.random()) * parameters.randomnessPower * (Math.random() * 2. - 1.)
        // powers[ i ] = Math.expm1(i / parameters.count * parameters.randomnessPower) * .01
        powers[i] = Math.pow(i / parameters.count, parameters.randomnessPower)
    }
    console.log("lut", performance.now() - t)
}
generatePowers()

let geometry
let points
let material
const PI2 = Math.PI * 2.;

const updateGalaxy = () =>
{
    const t = performance.now()
    let i, i3;
    let radius, spinAngle, branchAngle;
    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)
    const mixedColor = new THREE.Color()
    const randomOffset = new THREE.Vector3();

    for (i = 0; i < parameters.count; i++)
    {
        i3 = i * 3
        if (parameters.distributeStarsUniformly)
        {
            radius = Math.random() * parameters.radius
        }
        else
        {
            radius = powers[i] * parameters.radius
        }

        spinAngle = radius * parameters.spin
        branchAngle = (i % parameters.branches) / parameters.branches * PI2

        randomOffset.set(
            (Math.random() * 2. - 1.),
            (Math.random() * 2. - 1.),
            (Math.random() * 2. - 1.)
        ).normalize().multiplyScalar(parameters.distributionOffset + powers[ i ])

        positions[ i3 ] = Math.cos(branchAngle + spinAngle) * radius + randomOffset.x
        positions[ i3 + 1 ] = randomOffset.y
        positions[ i3 + 2 ] = Math.sin(branchAngle + spinAngle) * radius + randomOffset.z

        mixedColor.lerpColors(colorInside, colorOutside, radius / parameters.radius)
        colors[ i3 ] = mixedColor.r
        colors[ i3 + 1 ] = mixedColor.g
        colors[ i3 + 2 ] = mixedColor.b
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    console.log("upd", performance.now() - t)
}

const generateGalaxy = () =>
{
    const t = performance.now()
    if (points)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    let i, i3
    let radius, spinAngle, branchAngle
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    geometry = new THREE.BufferGeometry()
    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)
    const mixedColor = new THREE.Color()
    const randomOffset = new THREE.Vector3();

    for (i = 0; i < parameters.count; i++)
    {
        i3 = i * 3;
        if (parameters.distributeStarsUniformly)
        {
            radius = Math.random() * parameters.radius
        }
        else
        {
            radius = powers[ i ] * parameters.radius
        }
        spinAngle = radius * parameters.spin
        branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2.
        randomOffset.set(
            (Math.random() * 2. - 1.),
            (Math.random() * 2. - 1.),
            (Math.random() * 2. - 1.)
        ).normalize().multiplyScalar(parameters.distributionOffset + powers[ i ])

        positions[ i3 ] = Math.cos(branchAngle + spinAngle) * radius + randomOffset.x
        positions[ i3 + 1 ] = randomOffset.y
        positions[ i3 + 2 ] = Math.sin(branchAngle + spinAngle) * radius + randomOffset.z

        mixedColor.lerpColors(colorInside, colorOutside, radius / parameters.radius)
        colors[i3] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    )

    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
    )

    material = new THREE.PointsMaterial({
        // color: 0xff5588,
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    points = new THREE.Points(geometry, material)
    scene.add(points)

    console.log("gen", performance.now() - t)
}

gui.add(parameters, "count", 100, 1000000, 1000).onFinishChange(() =>
{
    generatePowers()
    generateGalaxy()
})
gui.add(parameters, "size", .001, .1, .001).onChange(() =>
{
    material.size = parameters.size
})
gui.add(parameters, "radius", .01, 20, .01).onChange(updateGalaxy)
gui.add(parameters, "branches", 2, 20, 1).onChange(updateGalaxy)
gui.add(parameters, "spin", -5, 5, .001).onChange(updateGalaxy)
gui.add(parameters, "distributionOffset", -1, 1, .01).onChange(updateGalaxy)
gui.add(parameters, "randomnessPower", minPower, maxPower, powerStep).onChange(() =>
{
    generatePowers()
    updateGalaxy()
})
gui.addColor(parameters, "insideColor").onChange(updateGalaxy)
gui.addColor(parameters, "outsideColor").onChange(updateGalaxy)
gui.add(parameters, "distributeStarsUniformly").onChange(updateGalaxy)

generateGalaxy();

/**
 * Test cube
 */
// const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 1, 1),
//     new THREE.MeshBasicMaterial()
// )
// scene.add(cube)

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
