import Swal from "sweetalert2";

export const deleteSourceFromScene = ({ id, getSelectedScene, setSources, sendOperation }) => {
  Swal.fire({
    title: "آیا مطمئن هستید؟",
    icon: "warning",
    showCancelButton: true,
    cancelButtonText: "خیر",
    confirmButtonColor: "limegreen",
    cancelButtonColor: "#d33",
    confirmButtonText: "بله",
  }).then(async (result) => {
    if (result.isConfirmed) {
      sendOperation("source", {
        action: "remove",
        id,
        payload: {},
      });

      // updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));
      setSources((prev) => prev.filter((item) => (item.externalId ?? item.id) !== id));

      let groupToRemove = getSelectedScene()?.layer.find(`#${id}`);

      if (groupToRemove) {
        for (let index = 0; index < groupToRemove.length; index++) {
          groupToRemove[index].remove();
        }
        getSelectedScene()?.layer.draw();
      } else {
        // console.error(`Group with id ${id} not found`);
      }

      const videoElement = getSelectedScene()?.resources.find(
        (item) => item.id === id
      )?.videoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
      }
    } else {
      return;
    }
  });
};
