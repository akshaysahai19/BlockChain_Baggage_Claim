function particleInit() {
    /* ---- particles.js config ---- */
    return particlesJS("particles-js", {
      particles: {
        number: {
          value: 380,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: "#3eb3e9",
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#3eb3e9",
          },
          polygon: {
            nb_sides: 5,
          },
          image: {
            src: "img/github.svg",
            width: 100,
            height: 100,
          },
        },
        opacity: {
          value: 0.2,
          random: false,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: false,
            speed: 40,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#3eb3e9",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 10,
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab",
          },
          onclick: {
            enable: true,
            mode: "push",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 1,
            },
          },
          bubble: {
            distance: 400,
            size: 40,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
          push: {
            particles_nb: 4,
          },
          remove: {
            particles_nb: 2,
          },
        },
      },
      retina_detect: true,
    });

    /* ---- stats.js config ---- */
    console.log("stats.js config loading...");
};

function updateUIState(memebershipStatus, accountType){
  console.log("updateUIState called...");
  if (accountType == 0) {
    if (memebershipStatus == 0) {
      $("#registerCustomerCard").css("display", "block");
      $("#registerAirportCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#airportTitle").css("display", "none");
      $("#buyerTitle").css("display", "none");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterAirportCard").css("display", "none");
      $("#unregisterCustomerCard").css("display", "none");
      $("#extraTokenCard").css("display", "none");

      $("#authorityTitle").css("display", "none");
      $("#changeAccountTypeCard").css("display", "none");
      $("#getBalanceCard").css("display", "none");
    } else if (memebershipStatus == 3) {
      $("#registerCustomerCard").css("display", "none");
      $("#registerAirportCard").css("display", "none");
      $("#claimRequestCard").css("display", "block");
      $("#settlePaymentCard").css("display", "block");
      $("#airportTitle").css("display", "none");
      $("#buyerTitle").css("display", "block");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterAirportCard").css("display", "none");
      $("#unregisterCustomerCard").css("display", "none");
      $("#extraTokenCard").css("display", "none");

      $("#authorityTitle").css("display", "none");
      $("#changeAccountTypeCard").css("display", "none");
      $("#getBalanceCard").css("display", "block");
    }
  } else if (accountType == 1) {
    if (memebershipStatus == 0) {
      $("#registerCustomerCard").css("display", "none");
      $("#registerAirportCard").css("display", "block");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#airportTitle").css("display", "none");
      $("#buyerTitle").css("display", "none");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterAirportCard").css("display", "none");
      $("#unregisterCustomerCard").css("display", "none");
      $("#extraTokenCard").css("display", "none");

      $("#authorityTitle").css("display", "none");
      $("#changeAccountTypeCard").css("display", "none");
      $("#getBalanceCard").css("display", "none");
    } else if (memebershipStatus == 1) {
      $("#registerCustomerCard").css("display", "none");
      $("#registerAirportCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#airportTitle").css("display", "block");
      $("#buyerTitle").css("display", "none");
      $("#addbaggageCard").css("display", "block");
      $("#claimResponseCard").css("display", "block");
      $("#unregisterAirportCard").css("display", "none");
      $("#unregisterCustomerCard").css("display", "none");
      $("#extraTokenCard").css("display", "none");

      $("#authorityTitle").css("display", "none");
      $("#changeAccountTypeCard").css("display", "none");
      $("#getBalanceCard").css("display", "block");
    }
  } else {
    if (memebershipStatus == 0) {
      $("#registerCustomerCard").css("display", "none");
      $("#registerAirportCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#airportTitle").css("display", "none");
      $("#buyerTitle").css("display", "none");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterAirportCard").css("display", "none");
      $("#unregisterCustomerCard").css("display", "none");
      $("#extraTokenCard").css("display", "none");

      $("#authorityTitle").css("display", "none");
      $("#changeAccountTypeCard").css("display", "block");
      $("#getBalanceCard").css("display", "none");
    }

    if (memebershipStatus == 2) {
      $("#registerCustomerCard").css("display", "none");
      $("#registerAirportCard").css("display", "none");
      $("#claimRequestCard").css("display", "none");
      $("#settlePaymentCard").css("display", "none");
      $("#airportTitle").css("display", "none");
      $("#buyerTitle").css("display", "none");
      $("#addbaggageCard").css("display", "none");
      $("#claimResponseCard").css("display", "none");
      $("#unregisterAirportCard").css("display", "block");
      $("#unregisterCustomerCard").css("display", "block");
      $("#extraTokenCard").css("display", "block");
      $("#authorityTitle").css("display", "block");
      $("#changeAccountTypeCard").css("display", "none");
      $("#getBalanceCard").css("display", "none");
    }
  }    
};

function resetUIFields(){
  console.log("particles.js config loading...");
  jQuery("#airportName").val("");
  jQuery("#perPriceBag").val("");
  jQuery("#totalAddBaggageNumber").val("");
  jQuery("#hashDetailsWhileClaim").val("");
  jQuery("#hashDetailsWhileClaim").val("");
  jQuery("#sellingAirportWhileClaim").val("");
  jQuery("#hashDetailsWhileResponse").val("");
  jQuery("#hashDetailsWhileSettle").val("");
}