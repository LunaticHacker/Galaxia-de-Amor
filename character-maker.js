var characterMaker = function(data) {


  var shirt_type = 'sleeveless'
  //console.log(data)

  if (data.sex === "male") shirt_type = "longsleeve"

  var image_array = [{
      src: `public/images/ULPC/body/${data.sex}/${data.skin}.png`
    }, {
      src: `public/images/ULPC/body/${data.sex}/eyes/${data.eye}.png`,
      x: 0,
      y: 0
    }, {
      src: `public/images/ULPC/hair/${data.sex}/${data.hair}/${data.haircolor}.png`,
      x: 0,
      y: 0
    }, {
      src: `public/images/ULPC/torso/shirts/${shirt_type}/${data.sex}/${data.shirt}_${shirt_type}.png`,
      x: 0,
      y: 0
    },
    {
      src: `public/images/ULPC/legs/pants/${data.sex}/${data.pants}_pants_${data.sex}.png`,
      x: 0,
      y: 0
    },
    {
      src: `public/images/ULPC/feet/shoes/${data.sex}/${data.shoes}_${data.sex}.png`,
      x: 0,
      y: 0
    },
  ]
  if (data.skin !== "red_orc" && data.skin !== "orc") {

    image_array.push({
      src: `public/images/ULPC/body/${data.sex}/nose/${data.nose}_${data.skin}.png`,
      x: 0,
      y: 0
    })
  }
  if (data.facial !== "none") {
    image_array.push({
      src: `public/images/ULPC/facial/${data.sex}/${data.facial}.png`,
      x: 0,
      y: 0
    })
  }
  return image_array
}
module.exports = characterMaker
