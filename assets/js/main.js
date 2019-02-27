var app = new Vue({
    el: '#app',
    data: () => {
        return {
            album: null
        }
    },
    mounted: function() {
        var self = this;
        getAlbum().then((album) => {
            self.album = album;
        }).catch((err) => {
            console.log(err);
        })
    }
})