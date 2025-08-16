{
  !isToggleLayout ? (
    <motion.div
      className="absolute top-0 left-[-20px] z-[100]"
      style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
      animate={{ x: "20px" }}
      transition={{ duration: 0.2 }}
    >
      <IconMenuSidebar openModal={openModal} />
    </motion.div>
  ) : (
    <>
      <motion.div
        className={`grid grid-cols-4 gap-[10px] p-[10px] w-full h-[350px] border-t overflow-y-auto items-center ${
          darkMode ? "" : "shadow-custome"
        } `}
        style={{ backgroundColor: darkMode ? "#222" : "#fff" }}
        animate={{
          height: isBottomControlsVisible ? "350px" : "0px",
          padding: isBottomControlsVisible ? "10px" : "0px",
        }}
        transition={{ duration: 0.5 }}
      >
        {isBottomControlsVisible && (
          <>
            <UsageSidebar />
            <ResourcesSidebar />
            <ScenesSidebar />

            <CollectionsSidebar />
          </>
        )}
      </motion.div>
      {/* Toggle Bottom Controls Button */}
      <div className="absolute right-0 bottom-0 transform -translate-x-1/2 mb-2 z-[100]">
        <Button
          auto
          ghost
          className="min-w-fit h-fit p-2"
          onPress={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
        >
          {isBottomControlsVisible ? <FaAngleDown /> : <FaAngleUp />}
        </Button>
      </div>
    </>
  );
}
